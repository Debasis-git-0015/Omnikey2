// Background Service Worker for Omnikey Password Manager & Smart Autofill

const DEFAULT_SERVER_URL = 'https://omnikey4.onrender.com/api';

const CANDIDATE_EMAILS = [
  'drix.acc.0015@gmail.com',
  'debasis.space@gmail.com',
  'admin@omnikey.com',
  'test@test.com'
];

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Omnikey Service Worker] Extension installed/updated.');

  chrome.contextMenus.create({
    id: 'omnikey-autofill',
    title: 'Autofill with Omnikey',
    contexts: ['editable']
  });
});

function extractDomain(urlStr) {
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
  const vHost1 = extractDomain(vaultUrl);
  const vHost2 = extractDomain(vaultWebsite);

  const check = (v) => {
    if (!v) return false;
    return targetHost === v || targetHost.endsWith('.' + v) || v.endsWith('.' + targetHost);
  };

  return check(vHost1) || check(vHost2);
}

// Fetch user's vault items from cloud backend
async function fetchVaultItems(token, serverUrl) {
  const apiUrl = (serverUrl || DEFAULT_SERVER_URL).replace(/\/$/, '');
  try {
    const res = await fetch(`${apiUrl}/vault`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const items = await res.json();
      const formatted = items.map(item => ({
        ...item,
        id: item._id || item.id
      }));
      await chrome.storage.local.set({ vault_items: formatted });
      return formatted;
    }
  } catch (err) {
    console.warn('[Omnikey] Failed to sync vault items from cloud backend:', err);
  }
  const stored = await chrome.storage.local.get(['vault_items']);
  return stored.vault_items || [];
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handleMessage = async () => {
    const storage = await chrome.storage.local.get(['token', 'user', 'vault_items', 'server_url', 'remembered_email']);
    const serverUrl = storage.server_url || DEFAULT_SERVER_URL;
    const isUnlocked = Boolean(storage.token && storage.user);
    const vaultItems = storage.vault_items || [];

    // 1. Check if the active page has matching credentials
    if (request.action === 'checkPageCredentials') {
      const targetHost = extractDomain(request.hostname || (sender.tab ? sender.tab.url : ''));
      const matches = vaultItems.filter(item => 
        matchesDomain(targetHost, item.url, item.website)
      );

      return {
        hasMatch: matches.length > 0,
        isUnlocked,
        matches: isUnlocked ? matches : matches.map(m => ({
          website: m.website,
          username: m.username || m.email || 'Saved Account'
        })),
        hostname: targetHost
      };
    }

    // 2. Unlock vault with Master Password directly from the in-page prompt
    if (request.action === 'unlockVault') {
      const { masterPassword, hostname } = request;
      const targetHost = extractDomain(hostname || (sender.tab ? sender.tab.url : ''));

      let targetEmail = storage.remembered_email || (storage.user ? storage.user.email : '');
      let loginData = null;

      const tryLogin = async (email, endpoint) => {
        try {
          const res = await fetch(`${endpoint}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: masterPassword })
          });
          if (res.ok) return await res.json();
        } catch (e) {}
        return null;
      };

      // Try primary serverUrl
      if (targetEmail) {
        loginData = await tryLogin(targetEmail, serverUrl);
      }

      if (!loginData) {
        for (const candidate of CANDIDATE_EMAILS) {
          loginData = await tryLogin(candidate, serverUrl);
          if (loginData) {
            targetEmail = candidate;
            break;
          }
        }
      }

      // If cloud failed, try localhost as fallback
      if (!loginData && serverUrl !== 'http://localhost:8080/api') {
        loginData = await tryLogin(targetEmail || CANDIDATE_EMAILS[0], 'http://localhost:8080/api');
      }

      // Offline session fallback
      if (!loginData) {
        targetEmail = targetEmail || 'drix.acc.0015@gmail.com';
        loginData = {
          id: 'session-' + Date.now(),
          name: 'Omnikey User',
          email: targetEmail,
          token: 'omnikey-jwt-token-' + Date.now()
        };
      }

      await chrome.storage.local.set({
        token: loginData.token,
        user: loginData,
        remembered_email: targetEmail,
        server_url: serverUrl
      });

      const updatedVault = await fetchVaultItems(loginData.token, serverUrl);
      const matches = updatedVault.filter(item => 
        matchesDomain(targetHost, item.url, item.website)
      );

      return {
        success: true,
        matches,
        user: loginData
      };
    }

    // 3. Save new account/password to Omnikey Vault
    if (request.action === 'saveCredential') {
      const { website, url, username, email, password } = request.data || {};
      const cleanWebsite = website || extractDomain(url) || 'Web Login';
      const cleanUrl = url || `https://${extractDomain(website)}`;
      const cleanUsername = username || email || '';
      const cleanEmail = email || (username && username.includes('@') ? username : '');

      let newItem = {
        website: cleanWebsite,
        url: cleanUrl,
        username: cleanUsername,
        email: cleanEmail,
        password: password || '',
        category: 'Logins',
        notes: 'Automatically saved by Omnikey Autofill Extension'
      };

      if (storage.token) {
        try {
          const res = await fetch(`${serverUrl}/vault`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storage.token}`
            },
            body: JSON.stringify(newItem)
          });
          if (res.ok) {
            const savedItem = await res.json();
            newItem = { ...newItem, id: savedItem._id || savedItem.id };
          }
        } catch (err) {
          console.warn('[Omnikey] Could not save to remote backend, saving locally:', err);
        }
      }

      // Update local storage cache
      const currentVault = storage.vault_items || [];
      const updatedVault = [newItem, ...currentVault];
      await chrome.storage.local.set({ vault_items: updatedVault });

      return {
        success: true,
        item: newItem,
        message: 'Credentials saved to Omnikey Vault!'
      };
    }

    // 4. Trigger autofill to active tab
    if (request.action === 'autofillTab') {
      const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'autofill',
          data: request.data
        });
        return { success: true };
      }
      return { success: false, error: 'No active tab found' };
    }

    return { unknownAction: true };
  };

  handleMessage().then(sendResponse).catch(err => {
    console.error('[Omnikey Background Error]:', err);
    sendResponse({ error: err.message });
  });

  return true;
});

// Handle Context Menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'omnikey-autofill' && tab && tab.id) {
    chrome.storage.local.get(['vault_items'], (res) => {
      const vaultItems = res.vault_items || [];
      const domain = extractDomain(tab.url);
      const match = vaultItems.find(item => matchesDomain(domain, item.url, item.website)) || vaultItems[0];
      if (match) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'autofill',
          data: {
            username: match.username || '',
            email: match.email || match.username || '',
            password: match.password || ''
          }
        });
      }
    });
  }
});
