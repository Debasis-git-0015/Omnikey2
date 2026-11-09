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

  function getPageEmail() {
    const inputs = document.querySelectorAll('input:not([type="password"]):not([type="hidden"])');
    for (const input of inputs) {
      const val = (input.value || '').trim();
      if (val && val.includes('@') && val.includes('.')) {
        return val.toLowerCase();
      }
    }
    return '';
  }

  // Initialize Page Detection
  initPageDetection();

  function initPageDetection() {
    const pageEmail = getPageEmail();
    chrome.runtime.sendMessage({
      action: 'checkPageCredentials',
      hostname: window.location.hostname,
      pageEmail: pageEmail
    }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      pageCredentialsState = response;

      // If unlocked and has matches, show autofill card with ALL matching passwords!
      if (response.isUnlocked && response.matches && response.matches.length > 0) {
        showAutofillCard(response.matches, true, response.detectedEmail);
      } else if (!response.isUnlocked) {
        // If locked but page has a password field, ready the unlock prompt
        const hasPasswordField = Boolean(document.querySelector('input[type="password"]'));
        if (hasPasswordField || response.hasMatch) {
          showAutofillCard(response.matches || [], false, response.detectedEmail);
        }
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
          if (!activeCard && pageCredentialsState) {
            showAutofillCard(pageCredentialsState.matches || [], pageCredentialsState.isUnlocked, pageCredentialsState.detectedEmail);
          }
        });
      }
    });
  }

  // 3. Google-Style Autofill Prompt Card (Showing ALL passwords for the specific website)
  function showAutofillCard(matches, isUnlocked, detectedEmail) {
    removeActiveCard();

    const domain = window.location.hostname.replace(/^www\./, '');
    const credList = Array.isArray(matches) ? matches : (matches ? [matches] : []);

    const card = document.createElement('div');
    card.id = 'omnikey-autofill-card';
    card.className = 'omnikey-g-card';

    // Build the Card HTML
    if (isUnlocked) {
      let credsHtml = '';
      if (credList.length > 0) {
        credsHtml = `
          <div class="omnikey-creds-container">
            ${credList.map((cred, idx) => {
              const u = cred.username || cred.email || 'Saved Account';
              const p = cred.password || '';
              return `
                <div class="omnikey-cred-item" data-index="${idx}">
                  <div class="omnikey-cred-top">
                    <span class="omnikey-cred-username" title="${escapeHtml(u)}">${escapeHtml(u)}</span>
                    <button class="omnikey-btn-fill-item" data-index="${idx}">Fill</button>
                  </div>
                  <div class="omnikey-cred-bottom">
                    <div class="omnikey-pass-display">
                      <span class="omnikey-pass-masked" id="pass-mask-${idx}">••••••••••••</span>
                      <span class="omnikey-pass-plain omnikey-hidden" id="pass-plain-${idx}">${escapeHtml(p)}</span>
                      <button type="button" class="omnikey-icon-btn omnikey-toggle-eye" data-index="${idx}" title="Show/Hide Password">
                        👁
                      </button>
                      <button type="button" class="omnikey-icon-btn omnikey-copy-pass" data-pass="${escapeHtml(p)}" title="Copy Password">
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        credsHtml = `
          <div style="padding: 10px; background: #F8F9FA; border-radius: 8px; font-size: 12px; color: #5F6368; margin: 10px 0;">
            No saved passwords found in this vault for <strong>${escapeHtml(domain)}</strong>.
          </div>
        `;
      }

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

        <div class="omnikey-account-tag">Vault: ${escapeHtml(detectedEmail || 'Active User')}</div>
        <div class="omnikey-card-title">Saved Passwords for ${escapeHtml(domain)} (${credList.length})</div>
        <div class="omnikey-card-subtitle">Select an account to autofill or view saved credentials:</div>

        ${credsHtml}

        <div class="omnikey-actions-row">
          <button class="omnikey-btn omnikey-btn-secondary" id="omnikey-dismiss-btn-2">Close</button>
          ${credList.length > 0 ? `
            <button class="omnikey-btn omnikey-btn-primary" id="omnikey-autofill-primary">
              <span>Autofill Best Match</span>
            </button>
          ` : ''}
        </div>
      `;
    } else {
      // Locked view: Prompt for Master Password to search this email's vault for this website!
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

        <div class="omnikey-card-title">Autofill passwords for ${escapeHtml(domain)}?</div>
        <div class="omnikey-card-subtitle">Enter your Master Password to search your vault and show all saved passwords for this site.</div>

        <div class="omnikey-unlock-section">
          <label style="font-size: 11px; font-weight: 600; color: #5F6368; display: block; margin-bottom: 4px;">ACCOUNT EMAIL</label>
          <input type="email" class="omnikey-unlock-input" id="omnikey-user-email" value="${escapeHtml(detectedEmail || '')}" placeholder="Enter your Omnikey email" style="margin-bottom: 8px;">
          
          <label style="font-size: 11px; font-weight: 600; color: #5F6368; display: block; margin-bottom: 4px;">MASTER PASSWORD</label>
          <input type="password" class="omnikey-unlock-input" id="omnikey-master-pass" placeholder="Enter Master Password" autofocus>
          <div id="omnikey-error-msg" style="color: #D93025; font-size: 11px; margin-top: 4px; display: none;"></div>
        </div>

        <div class="omnikey-actions-row">
          <button class="omnikey-btn omnikey-btn-secondary" id="omnikey-dismiss-btn-2">Never</button>
          <button class="omnikey-btn omnikey-btn-primary" id="omnikey-action-unlock">
            <span>Unlock & Show Passwords</span>
          </button>
        </div>
      `;
    }

    document.body.appendChild(card);
    activeCard = card;
    setTimeout(() => card.classList.add('show'), 40);

    const closeCard = () => {
      card.classList.remove('show');
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
        if (activeCard === card) activeCard = null;
      }, 200);
    };

    const btnClose1 = card.querySelector('#omnikey-dismiss-btn');
    const btnClose2 = card.querySelector('#omnikey-dismiss-btn-2');
    if (btnClose1) btnClose1.addEventListener('click', closeCard);
    if (btnClose2) btnClose2.addEventListener('click', closeCard);

    // Event Handlers for Unlocked View
    if (isUnlocked) {
      // Toggle Eye buttons
      card.querySelectorAll('.omnikey-toggle-eye').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = btn.getAttribute('data-index');
          const maskEl = card.querySelector(`#pass-mask-${idx}`);
          const plainEl = card.querySelector(`#pass-plain-${idx}`);
          if (maskEl && plainEl) {
            maskEl.classList.toggle('omnikey-hidden');
            plainEl.classList.toggle('omnikey-hidden');
          }
        });
      });

      // Copy buttons
      card.querySelectorAll('.omnikey-copy-pass').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const pass = btn.getAttribute('data-pass');
          navigator.clipboard.writeText(pass).then(() => {
            showPageToast('Password copied to clipboard!');
          });
        });
      });

      // Individual Fill buttons
      card.querySelectorAll('.omnikey-btn-fill-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (credList[idx]) {
            performAutofill(credList[idx]);
            showPageToast(`Filled credentials for ${credList[idx].username || credList[idx].email || 'account'}!`);
            closeCard();
          }
        });
      });

      // Primary Autofill Best Match button
      const btnPrimary = card.querySelector('#omnikey-autofill-primary');
      if (btnPrimary && credList.length > 0) {
        btnPrimary.addEventListener('click', () => {
          performAutofill(credList[0]);
          showPageToast('Form filled with saved credentials!');
          closeCard();
        });
      }
    } else {
      // Event Handlers for Locked View
      const btnUnlock = card.querySelector('#omnikey-action-unlock');
      const emailInput = card.querySelector('#omnikey-user-email');
      const passInput = card.querySelector('#omnikey-master-pass');
      const errorMsg = card.querySelector('#omnikey-error-msg');

      const doUnlock = () => {
        const email = emailInput ? emailInput.value.trim() : '';
        const masterPassword = passInput ? passInput.value.trim() : '';

        if (!masterPassword) {
          if (passInput) passInput.focus();
          return;
        }

        btnUnlock.innerHTML = '<span>Searching Vault...</span>';
        btnUnlock.disabled = true;
        if (errorMsg) errorMsg.style.display = 'none';

        chrome.runtime.sendMessage({
          action: 'unlockVault',
          email: email,
          masterPassword: masterPassword,
          hostname: window.location.hostname
        }, (res) => {
          if (res && res.success) {
            pageCredentialsState.isUnlocked = true;
            pageCredentialsState.matches = res.matches;
            pageCredentialsState.detectedEmail = res.user?.email || email;
            showPageToast(`Vault unlocked for ${res.user?.email || email}! Showing passwords.`);
            // Re-render card with ALL passwords found for this specific website!
            showAutofillCard(res.matches, true, res.user?.email || email);
          } else {
            btnUnlock.innerHTML = '<span>Unlock & Show Passwords</span>';
            btnUnlock.disabled = false;
            if (errorMsg) {
              errorMsg.textContent = res?.error || 'Incorrect Master Password. Please try again.';
              errorMsg.style.display = 'block';
            }
            if (passInput) {
              passInput.focus();
              passInput.style.borderColor = '#D93025';
            }
          }
        });
      };

      if (btnUnlock) btnUnlock.addEventListener('click', doUnlock);
      if (passInput) {
        passInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            doUnlock();
          }
        });
      }
    }
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
