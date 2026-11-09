// Google-style In-Page Engine for Omnikey Password Manager (Multi-User & Auto-Sync)

(function() {
  if (window.__omnikeyContentScriptLoaded) return;
  window.__omnikeyContentScriptLoaded = true;

  // 1. Strict check: NEVER show autofill prompts on Omnikey's own website/dashboard/login
  function isOmnikeyAppPage() {
    const host = window.location.hostname.toLowerCase();
    const port = window.location.port;
    const pathname = window.location.pathname.toLowerCase();

    // Verification test page is specifically for testing the extension
    if (pathname.includes('/test-page') || pathname.includes('test-page.html')) {
      return false;
    }

    // Exclude Omnikey deployed on Render or custom domain
    if (host.includes('omnikey') || host.includes('render.com')) {
      return true;
    }

    // Exclude local dev web app ports (Vite 3000/5173, Backend 8080)
    if (host === 'localhost' || host === '127.0.0.1') {
      if (port === '3000' || port === '5173' || port === '8080') {
        return true;
      }
    }

    // Exclude by document title if it represents Omnikey's app
    if (document.title.includes('Omnikey Administrator') || document.title.includes('Omnikey - AI Powered') || document.title.includes('Omnikey Vault')) {
      return true;
    }

    return false;
  }

  // 2. Seamless Session Sync: If user logs into Omnikey web app, auto-connect the extension to that user!
  if (isOmnikeyAppPage()) {
    function syncOmnikeyWebSession() {
      try {
        const token = localStorage.getItem('token');
        const userRaw = localStorage.getItem('user');
        if (token && userRaw) {
          const user = JSON.parse(userRaw);
          if (user && user.email) {
            chrome.runtime.sendMessage({
              action: 'syncWebSession',
              token,
              user
            });
          }
        }
      } catch (e) {}
    }

    // Sync on page load and on storage update
    syncOmnikeyWebSession();
    window.addEventListener('storage', syncOmnikeyWebSession);

    // Suppress in-page autofill and save prompts on Omnikey itself
    console.log('[Omnikey Extension] Omnikey domain detected. In-page autofill prompts suppressed on own app.');
    return;
  }

  console.log('[Omnikey Extension] Active on external site:', window.location.hostname);

  let pageCredentialsState = null;
  let activeCard = null;

  // Listen for background & popup direct triggers
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofill') {
      const result = performAutofill(request.data);
      sendResponse({ success: result.filledCount > 0, filledCount: result.filledCount });
    }
    if (request.action === 'vaultUnlocked') {
      initPageDetection();
      sendResponse({ received: true });
    }
    return true;
  });

  // Initialize Page Detection
  initPageDetection();

  function initPageDetection() {
    chrome.runtime.sendMessage({
      action: 'checkPageCredentials',
      hostname: window.location.hostname
    }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      pageCredentialsState = response;

      // If this website has a matching vault entry, pop up the autofill prompt
      if (response.hasMatch && response.matches && response.matches.length > 0) {
        showAutofillCard(response.matches[0], response.isUnlocked);
      }
      attachInputReopenListeners();
    });

    // Attach listener for capturing new accounts created on this website
    attachSavePasswordListeners();
  }

  function isUsernameOrEmailInput(input) {
    if (!input || input.type === 'password' || input.type === 'checkbox' || input.type === 'radio' || input.type === 'hidden') return false;
    const type = (input.type || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();

    return type === 'email' ||
           autocomplete.includes('username') ||
           autocomplete.includes('email') ||
           name.includes('user') || name.includes('email') || name.includes('login') ||
           id.includes('user') || id.includes('email') || id.includes('login') ||
           placeholder.includes('user') || placeholder.includes('email') || placeholder.includes('login');
  }

  function attachInputReopenListeners() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    inputs.forEach(input => {
      if (input.dataset.omnikeyReopenBound) return;
      input.dataset.omnikeyReopenBound = 'true';

      if (input.type === 'password' || isUsernameOrEmailInput(input)) {
        input.addEventListener('focus', () => {
          if (!activeCard && pageCredentialsState && pageCredentialsState.hasMatch) {
            showAutofillCard(pageCredentialsState.matches[0], pageCredentialsState.isUnlocked);
          }
        });
      }
    });
  }

  // 3. Google-Style Autofill Prompt Card
  function showAutofillCard(credential, isUnlocked) {
    removeActiveCard();

    const domain = window.location.hostname.replace(/^www\./, '');
    const username = credential.username || credential.email || 'Saved Account';

    const card = document.createElement('div');
    card.id = 'omnikey-autofill-card';
    card.className = 'omnikey-g-card';

    card.innerHTML = `
      <div class="omnikey-card-header">
        <div class="omnikey-brand-line">
          <div class="omnikey-shield-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z" fill="#FFFFFF"/>
            </svg>
          </div>
          <span class="omnikey-brand-title">Omnikey Password Manager</span>
        </div>
        <button class="omnikey-btn-close" id="omnikey-dismiss-btn" title="Dismiss">✕</button>
      </div>

      <div class="omnikey-card-title">Autofill password for ${escapeHtml(domain)}?</div>
      <div class="omnikey-card-subtitle">Use your saved credentials to sign in automatically.</div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">Username</span>
        <span class="omnikey-field-value">${escapeHtml(username)}</span>
      </div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">Password</span>
        <span class="omnikey-field-value omnikey-field-pass">••••••••••••</span>
      </div>

      ${!isUnlocked ? `
        <div class="omnikey-unlock-section">
          <input type="password" class="omnikey-unlock-input" id="omnikey-master-pass" placeholder="Enter Master Password to unlock" autofocus>
        </div>
      ` : ''}

      <div class="omnikey-actions-row">
        <button class="omnikey-btn omnikey-btn-secondary" id="omnikey-action-never">Never</button>
        <button class="omnikey-btn omnikey-btn-primary" id="omnikey-action-autofill">
          <span>${!isUnlocked ? 'Unlock & Fill' : 'Fill'}</span>
        </button>
      </div>
    `;

    document.body.appendChild(card);
    activeCard = card;
    setTimeout(() => card.classList.add('show'), 40);

    const btnDismiss = card.querySelector('#omnikey-dismiss-btn');
    const btnNever = card.querySelector('#omnikey-action-never');
    const btnAutofill = card.querySelector('#omnikey-action-autofill');
    const masterPassInput = card.querySelector('#omnikey-master-pass');

    const closeCard = () => {
      card.classList.remove('show');
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
        if (activeCard === card) activeCard = null;
      }, 200);
    };

    btnDismiss.addEventListener('click', closeCard);
    btnNever.addEventListener('click', closeCard);

    const handleFillAction = () => {
      if (!isUnlocked) {
        const masterPassword = masterPassInput ? masterPassInput.value.trim() : '';

        if (!masterPassword) {
          if (masterPassInput) masterPassInput.focus();
          return;
        }

        btnAutofill.innerHTML = '<span>Unlocking...</span>';
        btnAutofill.disabled = true;

        chrome.runtime.sendMessage({
          action: 'unlockVault',
          masterPassword,
          hostname: window.location.hostname
        }, (res) => {
          if (res && res.success) {
            pageCredentialsState.isUnlocked = true;
            pageCredentialsState.matches = res.matches;
            const fullCred = (res.matches && res.matches[0]) || credential;
            if (fullCred) {
              performAutofill(fullCred);
              showPageToast('Omnikey Unlocked & Form Filled!');
            } else {
              showPageToast('Omnikey Unlocked!');
            }
            closeCard();
          } else {
            btnAutofill.innerHTML = '<span>Unlock & Fill</span>';
            btnAutofill.disabled = false;
            if (masterPassInput) {
              masterPassInput.value = '';
              masterPassInput.placeholder = res?.error || 'Incorrect Master Password';
              masterPassInput.style.borderColor = '#D93025';
            }
          }
        });
      } else {
        performAutofill(credential);
        closeCard();
      }
    };
          } else {
            btnAutofill.innerHTML = '<span>Unlock & Fill</span>';
            btnAutofill.disabled = false;
            if (masterPassInput) {
              masterPassInput.value = '';
              masterPassInput.placeholder = res?.error || 'Incorrect Master Password';
              masterPassInput.style.borderColor = '#D93025';
            }
          }
        });
      } else {
        performAutofill(credential);
        closeCard();
      }
    };

    btnAutofill.addEventListener('click', handleFillAction);
    if (masterPassInput) {
      masterPassInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleFillAction();
        }
      });
    }
  }

  function removeActiveCard() {
    if (activeCard && activeCard.parentNode) {
      activeCard.parentNode.removeChild(activeCard);
      activeCard = null;
    }
  }

  // 4. Autofill inputs with synthetic event triggers
  function performAutofill(data) {
    const { username, email, password } = data || {};
    let filledCount = 0;

    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const allTextInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));

    let usernameInput = allTextInputs.find(i => isUsernameOrEmailInput(i));
    if (!usernameInput && passwordInputs.length > 0) {
      const firstPass = passwordInputs[0];
      usernameInput = allTextInputs.find(i => (i.compareDocumentPosition(firstPass) & Node.DOCUMENT_POSITION_FOLLOWING));
    }

    const targetUser = username || email;
    if (targetUser && usernameInput) {
      setInputValue(usernameInput, targetUser);
      highlightInput(usernameInput);
      filledCount++;
    }

    if (password && passwordInputs.length > 0) {
      passwordInputs.forEach(pInput => {
        setInputValue(pInput, password);
        highlightInput(pInput);
        filledCount++;
      });
    }

    if (filledCount > 0) {
      showPageToast(`Filled ${filledCount} field${filledCount > 1 ? 's' : ''}`);
    }

    return { filledCount };
  }

  function setInputValue(input, value) {
    if (!input) return;
    try {
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(input, value);
      } else {
        input.value = value;
      }

      ['input', 'change', 'keydown', 'keyup'].forEach(type => {
        input.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      });
      input.blur();
    } catch (e) {
      input.value = value;
    }
  }

  function highlightInput(input) {
    input.classList.add('omnikey-pulse-fill');
    setTimeout(() => {
      input.classList.remove('omnikey-pulse-fill');
    }, 2000);
  }

  // 5. Save Password Prompt when creating a new account on any website
  function attachSavePasswordListeners() {
    document.addEventListener('submit', (e) => {
      captureAndPromptSave(e.target);
    }, true);

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, input[type="submit"]');
      if (!btn) return;
      const text = (btn.textContent || btn.value || '').toLowerCase();
      const isSubmitBtn = btn.type === 'submit' || /sign\s*up|register|create\s*account|join|submit|log\s*in|sign\s*in|continue/i.test(text);

      if (isSubmitBtn) {
        const form = btn.closest('form') || document;
        captureAndPromptSave(form);
      }
    }, true);
  }

  function captureAndPromptSave(container) {
    if (!container) return;

    const passwordInputs = Array.from(container.querySelectorAll('input[type="password"]'));
    if (passwordInputs.length === 0) return;

    const password = passwordInputs[0].value;
    if (!password || password.length < 3) return;

    const textInputs = Array.from(container.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
    let usernameInput = textInputs.find(i => isUsernameOrEmailInput(i)) || textInputs[0];
    const username = usernameInput ? usernameInput.value.trim() : '';

    if (!username) return;

    const creds = {
      website: document.title.split(/[-|•:]/)[0].trim() || window.location.hostname,
      url: window.location.href,
      username,
      email: username.includes('@') ? username : '',
      password
    };

    promptSavePasswordCard(creds);
  }

  function promptSavePasswordCard(creds) {
    removeActiveCard();

    const card = document.createElement('div');
    card.id = 'omnikey-save-card';
    card.className = 'omnikey-g-card';

    const domain = window.location.hostname.replace(/^www\./, '');

    card.innerHTML = `
      <div class="omnikey-card-header">
        <div class="omnikey-brand-line">
          <div class="omnikey-shield-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z" fill="#FFFFFF"/>
            </svg>
          </div>
          <span class="omnikey-brand-title">Omnikey Password Manager</span>
        </div>
        <button class="omnikey-btn-close" id="omnikey-save-dismiss" title="Dismiss">✕</button>
      </div>

      <div class="omnikey-card-title">Save password for ${escapeHtml(domain)}?</div>
      <div class="omnikey-card-subtitle">Securely save to your Omnikey vault for automatic sign-in next time.</div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">Username</span>
        <span class="omnikey-field-value">${escapeHtml(creds.username)}</span>
      </div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">Password</span>
        <span class="omnikey-field-value omnikey-field-pass">••••••••••••</span>
      </div>

      <div class="omnikey-actions-row">
        <button class="omnikey-btn omnikey-btn-secondary" id="omnikey-btn-save-never">Never</button>
        <button class="omnikey-btn omnikey-btn-primary" id="omnikey-btn-save-confirm">Save</button>
      </div>
    `;

    document.body.appendChild(card);
    activeCard = card;
    setTimeout(() => card.classList.add('show'), 40);

    const btnDismiss = card.querySelector('#omnikey-save-dismiss');
    const btnNever = card.querySelector('#omnikey-btn-save-never');
    const btnSave = card.querySelector('#omnikey-btn-save-confirm');

    const closeCard = () => {
      card.classList.remove('show');
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
        if (activeCard === card) activeCard = null;
      }, 200);
    };

    btnDismiss.addEventListener('click', closeCard);
    btnNever.addEventListener('click', closeCard);

    btnSave.addEventListener('click', () => {
      btnSave.textContent = 'Saving...';
      btnSave.disabled = true;

      chrome.runtime.sendMessage({
        action: 'saveCredential',
        data: creds
      }, (res) => {
        if (res && res.success) {
          card.innerHTML = `
            <div style="text-align: center; padding: 12px 0;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #E6F4EA; color: #137333; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 20px;">✓</div>
              <div style="font-size: 14px; font-weight: 500; color: #202124;">Password saved to Omnikey</div>
              <div style="font-size: 12px; color: #5F6368; margin-top: 4px;">Ready for future automatic sign-in.</div>
            </div>
          `;
          setTimeout(closeCard, 2200);
        } else {
          showPageToast('Could not save password to vault', 'warning');
          closeCard();
        }
      });
    });
  }

  // Page Toast
  function showPageToast(message, type = 'success') {
    let toast = document.getElementById('omnikey-extension-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'omnikey-extension-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `omnikey-g-toast ${type} show`;

    setTimeout(() => {
      toast.className = 'omnikey-g-toast hidden';
    }, 3000);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
