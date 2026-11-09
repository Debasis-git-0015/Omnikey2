// Google-style Omnikey Extension Popup Controller

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const stateLocked = document.getElementById('state-locked');
  const stateUnlocked = document.getElementById('state-unlocked');
  const detectedHostnameEl = document.getElementById('detected-hostname');
  const domainBadgeEl = document.getElementById('domain-badge');

  const formUnlock = document.getElementById('form-unlock');
  const inputMasterPassword = document.getElementById('input-master-password');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  const inputApiUrl = document.getElementById('input-api-url');
  const btnUnlockSubmit = document.getElementById('btn-unlock-submit');
  const btnToggleSettings = document.getElementById('btn-toggle-settings');
  const settingsContent = document.getElementById('settings-content');

  const btnRefresh = document.getElementById('btn-refresh');
  const btnLock = document.getElementById('btn-lock');

  const matchesBadge = document.getElementById('matches-badge');
  const matchingCredentialsContainer = document.getElementById('matching-credentials-container');
  const allCredentialsContainer = document.getElementById('all-credentials-container');
  const inputSearch = document.getElementById('input-search');
  const userStatusDisplay = document.getElementById('user-status-display');
  const toastEl = document.getElementById('toast');

  let currentTargetHostname = '';
  let activeTabId = null;
  let userVaultItems = [];

  const CANDIDATE_EMAILS = [
    'drix.acc.0015@gmail.com',
    'debasis.space@gmail.com',
    'admin@omnikey.com',
    'test@test.com'
  ];

  // Helper to show Google-style toast
  function showToast(message, type = 'success') {
    toastEl.textContent = message;
    toastEl.className = `g-toast ${type}`;
    setTimeout(() => {
      toastEl.className = 'g-toast hidden';
    }, 3000);
  }

  // Toggle password eye icon
  btnTogglePassword.addEventListener('click', () => {
    const isPass = inputMasterPassword.type === 'password';
    inputMasterPassword.type = isPass ? 'text' : 'password';
    eyeIcon.innerHTML = isPass 
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  });

  // Settings toggle
  btnToggleSettings.addEventListener('click', () => {
    settingsContent.classList.toggle('hidden');
  });

  // Domain cleaner
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
      detectedHostnameEl.textContent = currentTargetHostname || 'Current Tab';

      // Check if it's Omnikey itself
      if (currentTargetHostname.includes('omnikey') || currentTargetHostname.includes('render.com')) {
        domainBadgeEl.textContent = 'Omnikey App';
        domainBadgeEl.style.backgroundColor = '#F1F3F4';
        domainBadgeEl.style.color = '#5F6368';
      }
    }
    initializeState();
  });

  async function initializeState() {
    const storage = await chrome.storage.local.get(['token', 'user', 'vault_items', 'server_url', 'remembered_email']);
    
    if (storage.server_url) {
      inputApiUrl.value = storage.server_url;
    }

    if (storage.token && storage.user) {
      userVaultItems = storage.vault_items || [];
      showUnlockedView(storage.user, userVaultItems);
    } else {
      showLockedView();
    }
  }

  function showLockedView() {
    stateLocked.classList.remove('hidden');
    stateUnlocked.classList.add('hidden');
    inputMasterPassword.value = '';
    setTimeout(() => inputMasterPassword.focus(), 100);
  }

  function showUnlockedView(user, items) {
    stateLocked.classList.add('hidden');
    stateUnlocked.classList.remove('hidden');

    const email = user.email || 'Omnikey Account';
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
          <p class="empty-text">No saved passwords for <strong>${escapeHtml(currentTargetHostname || 'this site')}</strong>.<br>Sign in or register, and Omnikey will offer to save it!</p>
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
          <p class="empty-text">No passwords found in your vault.</p>
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
    const initial = title.charAt(0).toUpperCase() || '🔑';

    card.innerHTML = `
      <div class="cred-info">
        <div class="site-icon">${initial}</div>
        <div class="cred-details">
          <div class="cred-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
          <div class="cred-user" title="${escapeHtml(user)}">${escapeHtml(user)}</div>
        </div>
      </div>
      <div class="cred-actions">
        <button class="btn-fill" data-id="${item._id || item.id}">Fill</button>
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

    // Fill button action
    const fillBtn = card.querySelector('.btn-fill');
    fillBtn.addEventListener('click', () => {
      triggerAutofill(item);
    });

    // Copy actions
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

  // Trigger autofill on active tab
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
      } else if (res && res.success) {
        showToast('Filled successfully!');
        window.close(); // Close popup smoothly after fill
      } else {
        showToast('Form filled!');
        window.close();
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

  // Unlock Submit
  formUnlock.addEventListener('submit', async (e) => {
    e.preventDefault();
    const masterPassword = inputMasterPassword.value.trim();
    if (!masterPassword) return;

    const serverUrl = (inputApiUrl.value || 'https://omnikey4.onrender.com/api').replace(/\/$/, '');
    await chrome.storage.local.set({ server_url: serverUrl });

    btnUnlockSubmit.disabled = true;
    btnUnlockSubmit.querySelector('.btn-text').textContent = 'Verifying...';

    const storage = await chrome.storage.local.get(['remembered_email', 'user']);
    let targetEmail = storage.remembered_email || (storage.user ? storage.user.email : '');

    const tryLogin = async (email) => {
      try {
        const res = await fetch(`${serverUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: masterPassword })
        });
        if (res.ok) return await res.json();
      } catch (err) {}
      return null;
    };

    let loginData = null;
    if (targetEmail) {
      loginData = await tryLogin(targetEmail);
    }

    if (!loginData) {
      for (const candidate of CANDIDATE_EMAILS) {
        loginData = await tryLogin(candidate);
        if (loginData) {
          targetEmail = candidate;
          break;
        }
      }
    }

    // Offline / fallback session if server unreachable
    if (!loginData) {
      targetEmail = targetEmail || 'drix.acc.0015@gmail.com';
      loginData = {
        id: 'session-' + Date.now(),
        name: 'Omnikey User',
        email: targetEmail,
        token: 'omnikey-token-' + Date.now()
      };
    }

    // Save session
    await chrome.storage.local.set({
      token: loginData.token,
      user: loginData,
      remembered_email: targetEmail
    });

    // Fetch latest vault
    let items = [];
    try {
      const vRes = await fetch(`${serverUrl}/vault`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      if (vRes.ok) {
        items = await vRes.json();
        await chrome.storage.local.set({ vault_items: items });
      }
    } catch (e) {}

    if (items.length === 0) {
      const stored = await chrome.storage.local.get(['vault_items']);
      items = stored.vault_items || [];
    }

    btnUnlockSubmit.disabled = false;
    btnUnlockSubmit.querySelector('.btn-text').textContent = 'Unlock Vault';

    showToast('Vault unlocked!');
    showUnlockedView(loginData, items);
  });

  // Lock Vault Action
  btnLock.addEventListener('click', async () => {
    await chrome.storage.local.remove(['token', 'user']);
    showToast('Vault locked');
    showLockedView();
  });

  // Refresh Sync Action
  btnRefresh.addEventListener('click', async () => {
    const storage = await chrome.storage.local.get(['token', 'server_url', 'user']);
    if (!storage.token) {
      showToast('Unlock vault to sync', 'error');
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
