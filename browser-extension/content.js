(function() {
  if (window.__omnikeyContentScriptLoaded) return;
  window.__omnikeyContentScriptLoaded = true;

  // 1. Check if the current page is Omnikey's own web app (Do NOT show on own login/register pages)
  function isOmnikeyAppPage() {
    const host = window.location.hostname.toLowerCase();
    const port = window.location.port;
    const pathname = window.location.pathname.toLowerCase();

    // Allow on verification test page so the user can test the features
    if (pathname.includes('/test-page') || pathname.includes('test-page.html')) {
      return false;
    }

    // Exclude Omnikey web dashboard and auth pages on localhost:3000, localhost:5173, localhost:8080
    if (host === 'localhost' || host === '127.0.0.1') {
      if (port === '3000' || port === '5173' || port === '8080') {
        return true;
      }
    }

    // Exclude if title identifies as the Omnikey application itself
    if (document.title.includes('Omnikey Administrator') || document.title.includes('Omnikey - AI Powered')) {
      return true;
    }

    return false;
  }

  // If on Omnikey's own website, exit completely so it never interrupts the user's login
  if (isOmnikeyAppPage()) {
    console.log('[Omnikey Extension] Omnikey app page detected. Autofill prompts suppressed on own domain.');
    return;
  }

  console.log('[Omnikey Extension] Smart Autofill & In-Page Engine active on external site:', window.location.hostname);

  let pageCredentialsState = null;
  let activeCard = null;

  // 2. Listen for background & popup messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofill') {
      const result = performAutofill(request.data);
      sendResponse({ success: result.filledCount > 0, filledCount: result.filledCount });
    }
    return true;
  });

  // 3. Initialize in-page smart detection on page load
  initPageDetection();

  function initPageDetection() {
    chrome.runtime.sendMessage({
      action: 'checkPageCredentials',
      hostname: window.location.hostname
    }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      pageCredentialsState = response;

      if (response.hasMatch && response.matches && response.matches.length > 0) {
        console.log(`[Omnikey] Found ${response.matches.length} matching credential(s) for ${response.hostname}`);
        
        // Show the prompt card matching the user's reference design
        showAutofillCard(response.matches[0], response.isUnlocked);

        // Also bind to input clicks so if user dismisses, clicking brings it back
        attachInputReopenListeners();
      }
    });

    // Attach "Save Password" listener for when a new account is registered on this website
    attachSavePasswordListeners();
  }

  // Helper to test if an input is username/email
  function isUsernameOrEmailInput(input) {
    if (!input || input.type === 'password' || input.type === 'checkbox' || input.type === 'radio') return false;
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

  // 4. Render the In-Page Autofill Card (Exact Type Matching User's Reference Screenshot)
  function showAutofillCard(credential, isUnlocked) {
    removeActiveCard();

    const domain = window.location.hostname.replace(/^www\./, '');
    const username = credential.username || credential.email || 'Saved Account';

    const card = document.createElement('div');
    card.id = 'omnikey-autofill-card';
    card.className = 'omnikey-floating-card';

    card.innerHTML = `
      <div class="omnikey-card-header">
        <div class="omnikey-brand-box">
          <div class="omnikey-shield-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <span class="omnikey-brand-title">Omnikey Password Manager</span>
        </div>
        <button class="omnikey-close-btn" id="omnikey-autofill-dismiss" title="Dismiss">✕</button>
      </div>

      <div class="omnikey-card-title">Autofill credentials for ${escapeHtml(domain)}?</div>
      <div class="omnikey-card-subtitle">Click to automatically fill your stored login credentials.</div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">USERNAME</span>
        <span class="omnikey-field-val">${escapeHtml(username)}</span>
      </div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">PASSWORD</span>
        <span class="omnikey-field-val omnikey-field-pass">••••••••••••</span>
      </div>

      ${!isUnlocked ? `
        <div class="omnikey-unlock-section">
          <div class="omnikey-unlock-input-wrap">
            <input type="password" class="omnikey-unlock-input" id="omnikey-master-pass" placeholder="Enter Master Password to unlock" autofocus>
          </div>
        </div>
      ` : ''}

      <div class="omnikey-card-actions">
        <button class="omnikey-btn omnikey-btn-secondary" id="omnikey-btn-dismiss">Never</button>
        <button class="omnikey-btn omnikey-btn-primary" id="omnikey-btn-autofill">
          <span>⚡ ${!isUnlocked ? 'Unlock & Autofill' : 'Autofill'}</span>
        </button>
      </div>
    `;

    document.body.appendChild(card);
    activeCard = card;
    setTimeout(() => card.classList.add('show'), 50);

    const btnClose = card.querySelector('#omnikey-autofill-dismiss');
    const btnDismiss = card.querySelector('#omnikey-btn-dismiss');
    const btnAutofill = card.querySelector('#omnikey-btn-autofill');
    const masterPassInput = card.querySelector('#omnikey-master-pass');

    const closeCard = () => {
      card.classList.remove('show');
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
        if (activeCard === card) activeCard = null;
      }, 250);
    };

    btnClose.addEventListener('click', closeCard);
    btnDismiss.addEventListener('click', closeCard);

    const handleExecuteAutofill = () => {
      if (!isUnlocked) {
        const masterPassword = masterPassInput ? masterPassInput.value.trim() : '';
        if (!masterPassword) {
          if (masterPassInput) masterPassInput.focus();
          return;
        }

        btnAutofill.innerHTML = '<span>Verifying...</span>';
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
            performAutofill(fullCred);
            showPageToast('⚡ Omnikey Authenticated & Autofilled!');
            closeCard();
          } else {
            btnAutofill.innerHTML = '<span>⚡ Unlock & Autofill</span>';
            btnAutofill.disabled = false;
            if (masterPassInput) {
              masterPassInput.value = '';
              masterPassInput.placeholder = 'Incorrect Master Password';
              masterPassInput.style.borderColor = '#D96B6B';
            }
          }
        });
      } else {
        performAutofill(credential);
        closeCard();
      }
    };

    btnAutofill.addEventListener('click', handleExecuteAutofill);
    if (masterPassInput) {
      masterPassInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleExecuteAutofill();
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

  // 5. Form Autofill Execution
  function performAutofill(data) {
    const { username, email, password } = data || {};
    let filledCount = 0;

    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const allTextInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));

    // Find Username input
    let usernameInput = allTextInputs.find(i => isUsernameOrEmailInput(i));
    if (!usernameInput && passwordInputs.length > 0) {
      const firstPass = passwordInputs[0];
      usernameInput = allTextInputs.find(i => (i.compareDocumentPosition(firstPass) & Node.DOCUMENT_POSITION_FOLLOWING));
    }

    // Fill Username
    const targetUser = username || email;
    if (targetUser && usernameInput) {
      setInputValue(usernameInput, targetUser);
      highlightInput(usernameInput);
      filledCount++;
    }

    // Fill Password
    if (password && passwordInputs.length > 0) {
      passwordInputs.forEach(pInput => {
        setInputValue(pInput, password);
        highlightInput(pInput);
        filledCount++;
      });
    }

    if (filledCount > 0) {
      showPageToast(`⚡ Omnikey Autofilled ${filledCount} field${filledCount > 1 ? 's' : ''}!`);
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
    input.classList.add('omnikey-autofilled-pulse');
    setTimeout(() => {
      input.classList.remove('omnikey-autofilled-pulse');
    }, 2500);
  }

  // 6. Automatic "Save Password" Prompt for New Account Registrations
  function attachSavePasswordListeners() {
    // Intercept form submissions
    document.addEventListener('submit', (e) => {
      captureCredentialsFromForm(e.target);
    }, true);

    // Intercept register / submit button clicks
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, input[type="submit"]');
      if (!btn) return;
      const text = (btn.textContent || btn.value || '').toLowerCase();
      const isSubmitBtn = btn.type === 'submit' || /sign\s*up|register|create\s*account|join|submit|log\s*in|sign\s*in|continue/i.test(text);

      if (isSubmitBtn) {
        const form = btn.closest('form') || document;
        captureCredentialsFromForm(form);
      }
    }, true);
  }

  function captureCredentialsFromForm(formContainer) {
    if (!formContainer) return;

    const passwordInputs = Array.from(formContainer.querySelectorAll('input[type="password"]'));
    if (passwordInputs.length === 0) return;

    const password = passwordInputs[0].value;
    if (!password || password.length < 3) return;

    const textInputs = Array.from(formContainer.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
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

    // Show the Save Password Card
    promptSavePasswordCard(creds);
  }

  // Prompt Card Matching User's Reference Screenshot
  function promptSavePasswordCard(creds) {
    removeActiveCard();

    const card = document.createElement('div');
    card.id = 'omnikey-save-card';
    card.className = 'omnikey-floating-card';

    const domain = window.location.hostname.replace(/^www\./, '');

    card.innerHTML = `
      <div class="omnikey-card-header">
        <div class="omnikey-brand-box">
          <div class="omnikey-shield-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <span class="omnikey-brand-title">Omnikey Password Manager</span>
        </div>
        <button class="omnikey-close-btn" id="omnikey-save-dismiss" title="Dismiss">✕</button>
      </div>

      <div class="omnikey-card-title">Save password for ${escapeHtml(domain)}?</div>
      <div class="omnikey-card-subtitle">Securely register this credential to your encrypted Omnikey vault.</div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">USERNAME</span>
        <span class="omnikey-field-val">${escapeHtml(creds.username)}</span>
      </div>

      <div class="omnikey-field-row">
        <span class="omnikey-field-label">PASSWORD</span>
        <span class="omnikey-field-val omnikey-field-pass">••••••••••••</span>
      </div>

      <div class="omnikey-card-actions">
        <button class="omnikey-btn omnikey-btn-secondary" id="omnikey-btn-save-never">Never</button>
        <button class="omnikey-btn omnikey-btn-primary" id="omnikey-btn-save-confirm">💾 Save to Vault</button>
      </div>
    `;

    document.body.appendChild(card);
    activeCard = card;
    setTimeout(() => card.classList.add('show'), 50);

    const btnDismiss = card.querySelector('#omnikey-save-dismiss');
    const btnNever = card.querySelector('#omnikey-btn-save-never');
    const btnSave = card.querySelector('#omnikey-btn-save-confirm');

    const closeCard = () => {
      card.classList.remove('show');
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
        if (activeCard === card) activeCard = null;
      }, 250);
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
            <div style="text-align: center; padding: 14px 0;">
              <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
              <div style="font-size: 15px; font-weight: 800; color: #172033;">Saved to Omnikey Vault!</div>
              <div style="font-size: 12px; color: #42A982; margin-top: 4px; font-weight: 700;">Ready for future automatic logins.</div>
            </div>
          `;
          setTimeout(closeCard, 2000);
        } else {
          showPageToast('Failed to save to Omnikey Vault', 'warning');
          closeCard();
        }
      });
    });
  }

  // 7. Page Toast Helper
  function showPageToast(message, type = 'success') {
    let toast = document.getElementById('omnikey-extension-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'omnikey-extension-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `omnikey-toast ${type} show`;

    setTimeout(() => {
      toast.className = 'omnikey-toast hidden';
    }, 3500);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
