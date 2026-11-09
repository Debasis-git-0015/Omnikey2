// Google-style Omnikey Extension Popup Controller (Multi-User & Website Password Search)

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const stateLocked = document.getElementById('state-locked');
  const stateUnlocked = document.getElementById('state-unlocked');
  const lockedTitle = document.getElementById('locked-title');
  const lockedSubtitle = document.getElementById('locked-subtitle');
  const detectedHostnameEl = document.getElementById('detected-hostname');
  const domainBadgeEl = document.getElementById('domain-badge');

  const formUnlock = document.getElementById('form-unlock');
  const inputEmail = document.getElementById('input-email');
  const inputMasterPassword = document.getElementById('input-master-password');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  const inputApiUrl = document.getElementById('input-api-url');
  const btnUnlockSubmit = document.getElementById('btn-unlock-submit');
  const btnToggleSettings = document.getElementById('btn-toggle-settings');
  const settingsContent = document.getElementById('settings-content');

  const btnRefresh = document.getElementById('btn-refresh');
  const btnLock = document.getElementById('btn-lock');
  const btnLogout = document.getElementById('btn-logout');

  const matchesBadge = document.getElementById('matches-badge');
  const matchingCredentialsContainer = document.getElementById('matching-credentials-container');
  const allCredentialsContainer = document.getElementById('all-credentials-container');
  const inputSearch = document.getElementById('input-search');
  const userStatusDisplay = document.getElementById('user-status-display');
  const toastEl = document.getElementById('toast');

  let currentTargetHostname = '';
  let activeTabId = null;
  let userVaultItems = [];

  // Helper to show Google-style toast
  function showToast(message, type = 'success') {
    toastEl.textContent = message;
    toastEl.className = `g-toast ${type}`;
    setTimeout(() => {
      toastEl.className = 'g-toast hidden';
    }, 3200);
  }

  // Toggle password visibility in unlock input
  if (btnTogglePassword && inputMasterPassword) {
    btnTogglePassword.addEventListener('click', () => {
      const isPass = inputMasterPassword.type === 'password';
      inputMasterPassword.type = isPass ? 'text' : 'password';
      eyeIcon.innerHTML = isPass 
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    });
  }

  // Settings toggle
  if (btnToggleSettings && settingsContent) {
    btnToggleSettings.addEventListener('click', () => {
      settingsContent.classList.toggle('hidden');
    });
  }

  function extractHostname(urlStr) {
    if (!urlStr) return '';
    try {
      const url = new URL(urlStr);
      let host = url.hostname.toLowerCase().trim();
      if (host.startsWith('www.')) host = host.substring(4);
      return host;
    } catch (e) {
      let clean = (urlStr || '').toLowerCase().trim();
      clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
      return clean;
    }
  }

  function matchesDomain(targetHost, vaultUrl, vaultWebsite) {
    if (!targetHost) return false;
    const vHost1 = extractHostname(vaultUrl);
    const vHost2 = extractHostname(vaultWebsite);
    const check = (v) => {
      if (!v) return false;
      return targetHost === v || targetHost.endsWith('.' + v) || v.endsWith('.' + targetHost);
    };
    return check(vHost1) || check(vHost2);
  }

  // Detect current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      activeTabId = tabs[0].id;
      const url = tabs[0].url || '';
      currentTargetHostname = extractHostname(url);
      detectedHostnameEl.textContent = currentTargetHostname || 'Current Site';

      if (currentTargetHostname.includes('omnikey') || currentTargetHostname.includes('render.com')) {
        domainBadgeEl.textContent = 'Omnikey App';
        domainBadgeEl.style.backgroundColor = '#F1F3F4';
        domainBadgeEl.style.color = '#5F6368';
      }
    }
    initializeState();
  });

  async function getDetectedEmail() {
    const storage = await chrome.storage.local.get(['browser_email', 'remembered_email', 'user']);
    if (storage.browser_email) return storage.browser_email;
    if (storage.user && storage.user.email) return storage.user.email;
    if (storage.remembered_email) return storage.remembered_email;

    return new Promise((resolve) => {
      try {
        if (chrome.identity && chrome.identity.getProfileUserInfo) {
          chrome.identity.getProfileUserInfo((info) => {
            if (info && info.email) {
              resolve(info.email.trim().toLowerCase());
            } else {
              resolve('');
            }
          });
        } else {
          resolve('');
        }
      } catch (e) {
        resolve('');
      }
    });
  }

  async function initializeState() {
    const storage = await chrome.storage.local.get(['token', 'user', 'vault_items', 'server_url']);
    
    if (storage.server_url && inputApiUrl) {
      inputApiUrl.value = storage.server_url;
    }

    if (storage.token && storage.user) {
      userVaultItems = storage.vault_items || [];
      showUnlockedView(storage.user, userVaultItems);
    } else {
      const email = await getDetectedEmail();
      showLockedView(email);
    }
  }

  function showLockedView(prefillEmail = '') {
    stateLocked.classList.remove('hidden');
    stateUnlocked.classList.add('hidden');

    btnRefresh.classList.add('hidden');
    btnLock.classList.add('hidden');
    btnLogout.classList.add('hidden');

    if (inputEmail && prefillEmail) {
      inputEmail.value = prefillEmail;
    }
    inputMasterPassword.value = '';
    btnUnlockSubmit.disabled = false;
    btnUnlockSubmit.querySelector('.btn-text').textContent = 'Unlock Vault & Show Passwords';

    if (inputEmail && !inputEmail.value) {
      setTimeout(() => inputEmail.focus(), 100);
    } else {
      setTimeout(() => inputMasterPassword.focus(), 100);
    }
  }

  function showUnlockedView(user, items) {
    stateLocked.classList.add('hidden');
    stateUnlocked.classList.remove('hidden');

    btnRefresh.classList.remove('hidden');
    btnLock.classList.remove('hidden');
    btnLogout.classList.remove('hidden');

    const email = user.email || user.name || 'Omnikey Account';
    userStatusDisplay.textContent = email;

    renderVaultItems(items);
  }

  function renderVaultItems(items) {
    userVaultItems = items || [];

    // 1. Matches for current tab
    const matches = userVaultItems.filter(item => 
      matchesDomain(currentTargetHostname, item.url, item.website)
    );

    matchesBadge.textContent = matches.length;
    matchingCredentialsContainer.innerHTML = '';

    if (matches.length > 0) {
      matches.forEach(item => {
        matchingCredentialsContainer.appendChild(createCredElement(item, true));
      });
    } else {
      matchingCredentialsContainer.innerHTML = `
        <div class="empty-box">
          <p class="empty-text">No saved passwords for <strong>${escapeHtml(currentTargetHostname || 'this site')}</strong> in this vault.<br>When you log in or register, Omnikey will offer to save it!</p>
        </div>
      `;
    }

    // 2. All saved items
    renderAllItemsList(userVaultItems);
  }

  function renderAllItemsList(itemsToRender) {
    allCredentialsContainer.innerHTML = '';
    if (!itemsToRender || itemsToRender.length === 0) {
      allCredentialsContainer.innerHTML = `
        <div class="empty-box">
          <p class="empty-text">No passwords in your vault yet.</p>
        </div>
      `;
      return;
    }

    itemsToRender.forEach(item => {
      allCredentialsContainer.appendChild(createCredElement(item, false));
    });
  }

  function createCredElement(item, isMatch) {
    const card = document.createElement('div');
    card.className = `cred-card ${isMatch ? 'featured' : ''}`;

    const title = item.website || extractHostname(item.url) || 'Login';
    const user = item.username || item.email || 'No username';
    const plainPass = item.password || '';
    const initial = title.charAt(0).toUpperCase() || '🔑';

    card.innerHTML = `
      <div class="cred-info">
        <div class="site-icon">${initial}</div>
        <div class="cred-details">
          <div class="cred-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
          <div class="cred-user" title="${escapeHtml(user)}">${escapeHtml(user)}</div>
          <div class="cred-pass-preview" style="display:flex; align-items:center; gap:6px; margin-top:2px;">
            <span class="pass-mask" style="font-family:monospace; font-size:12px; letter-spacing:1px; color:#5F6368;">••••••••••••</span>
            <span class="pass-plain hidden" style="font-family:monospace; font-size:12px; color:#1A73E8; font-weight:500;">${escapeHtml(plainPass)}</span>
          </div>
        </div>
      </div>
      <div class="cred-actions">
        <button class="btn-fill" data-id="${item._id || item.id}" title="Autofill this account">Fill</button>
        <button class="btn-toggle-view" title="Show / Hide Password">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="btn-copy" data-type="user" title="Copy username">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="btn-copy" data-type="pass" title="Copy password">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </button>
      </div>
    `;

    // Fill button
    const fillBtn = card.querySelector('.btn-fill');
    fillBtn.addEventListener('click', () => {
      triggerAutofill(item);
    });

    // Eye toggle button to show/hide plaintext password
    const toggleViewBtn = card.querySelector('.btn-toggle-view');
    const maskSpan = card.querySelector('.pass-mask');
    const plainSpan = card.querySelector('.pass-plain');
    toggleViewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      maskSpan.classList.toggle('hidden');
      plainSpan.classList.toggle('hidden');
    });

    // Copy buttons
    const copyBtns = card.querySelectorAll('.btn-copy');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-type');
        const textToCopy = type === 'user' ? (item.username || item.email || '') : (item.password || '');
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copied ${type === 'user' ? 'username' : 'password'}!`);
        });
      });
    });

    return card;
  }

  function triggerAutofill(item) {
    if (!activeTabId) return;

    chrome.tabs.sendMessage(activeTabId, {
      action: 'autofill',
      data: {
        username: item.username || item.email || '',
        email: item.email || item.username || '',
        password: item.password || ''
      }
    }, (res) => {
      if (chrome.runtime.lastError) {
        showToast('Please open an active webpage to autofill', 'error');
      } else {
        showToast('Filled credentials into form!');
        setTimeout(() => window.close(), 400);
      }
    });
  }

  // Live Search
  inputSearch.addEventListener('input', (e) => {
    const q = (e.target.value || '').toLowerCase().trim();
    if (!q) {
      renderAllItemsList(userVaultItems);
      return;
    }
    const filtered = userVaultItems.filter(i => 
      (i.website && i.website.toLowerCase().includes(q)) ||
      (i.username && i.username.toLowerCase().includes(q)) ||
      (i.email && i.email.toLowerCase().includes(q)) ||
      (i.url && i.url.toLowerCase().includes(q))
    );
    renderAllItemsList(filtered);
  });

  // Unlock Submit via Email + Master Password
  formUnlock.addEventListener('submit', async (e) => {
    e.preventDefault();

    const targetEmail = inputEmail ? inputEmail.value.trim().toLowerCase() : '';
    const masterPassword = inputMasterPassword.value.trim();

    if (!masterPassword) {
      showToast('Please enter your Master Password', 'error');
      inputMasterPassword.focus();
      return;
    }

    const serverUrl = (inputApiUrl.value || 'https://omnikey4.onrender.com/api').replace(/\/$/, '');
    await chrome.storage.local.set({ server_url: serverUrl });

    btnUnlockSubmit.disabled = true;
    btnUnlockSubmit.querySelector('.btn-text').textContent = 'Searching Vault...';

    try {
      const payload = {
        password: masterPassword,
        hostname: currentTargetHostname
      };
      if (targetEmail) {
        payload.email = targetEmail;
      }

      const res = await fetch(`${serverUrl}/auth/master-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        const errorMsg = data.error || data.message || 'Incorrect Master Password. Please try again.';
        showToast(errorMsg, 'error');
        btnUnlockSubmit.disabled = false;
        btnUnlockSubmit.querySelector('.btn-text').textContent = 'Unlock Vault & Show Passwords';
        inputMasterPassword.focus();
        return;
      }

      // Successful unlock for the specific email vault!
      const userData = {
        id: data.id || data._id,
        name: data.name || data.email?.split('@')[0] || 'Omnikey User',
        email: data.email,
        token: data.token
      };

      const items = data.vault_items || [];

      await chrome.storage.local.set({
        token: data.token,
        user: userData,
        vault_items: items,
        browser_email: userData.email,
        remembered_email: userData.email,
        server_url: serverUrl
      });

      btnUnlockSubmit.disabled = false;
      btnUnlockSubmit.querySelector('.btn-text').textContent = 'Unlock Vault & Show Passwords';

      showToast(`Vault unlocked for ${userData.email}!`);
      showUnlockedView(userData, items);

      // Notify active tab that vault is unlocked so in-page prompts update immediately with all passwords!
      if (activeTabId) {
        chrome.tabs.sendMessage(activeTabId, {
          action: 'vaultUnlocked',
          user: userData,
          vault_items: items
        }, () => {
          if (chrome.runtime.lastError) {}
        });
      }
    } catch (netErr) {
      console.error('Master unlock network error:', netErr);
      showToast('Cannot connect to Omnikey server. Check API URL.', 'error');
      btnUnlockSubmit.disabled = false;
      btnUnlockSubmit.querySelector('.btn-text').textContent = 'Unlock Vault & Show Passwords';
    }
  });

  // Lock Vault
  btnLock.addEventListener('click', async () => {
    await chrome.storage.local.remove(['token', 'user']);
    showToast('Vault locked');
    const email = await getDetectedEmail();
    showLockedView(email);
  });

  // Sign Out / Clear All
  btnLogout.addEventListener('click', async () => {
    await chrome.storage.local.remove(['token', 'user', 'vault_items']);
    showToast('Signed out of Omnikey');
    showLockedView('');
  });

  // Refresh Sync Action
  btnRefresh.addEventListener('click', async () => {
    const storage = await chrome.storage.local.get(['token', 'server_url']);
    if (!storage.token) {
      showToast('Please unlock your vault first', 'error');
      return;
    }

    const serverUrl = storage.server_url || 'https://omnikey4.onrender.com/api';
    try {
      const res = await fetch(`${serverUrl}/vault`, {
        headers: { 'Authorization': `Bearer ${storage.token}` }
      });
      if (res.ok) {
        const items = await res.json();
        await chrome.storage.local.set({ vault_items: items });
        userVaultItems = items;
        renderVaultItems(items);
        showToast('Vault synchronized!');
      } else {
        showToast('Sync failed', 'error');
      }
    } catch (e) {
      showToast('Network error while syncing', 'error');
    }
  });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
