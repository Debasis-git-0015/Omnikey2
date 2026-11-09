// Background Service Worker for Omnikey Password Manager & Smart Autofill (Multi-User)

const DEFAULT_SERVER_URL = 'https://omnikey4.onrender.com/api';

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
    console.warn('[Omnikey] Failed to sync vault items from backend:', err);
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

    // 1. Sync session directly from Omnikey web dashboard when any user logs in
    if (request.action === 'syncWebSession') {
      const { token, user } = request;
      if (token && user && user.email) {
        console.log(`[Omnikey] Syncing web session for user: ${user.email}`);
        await chrome.storage.local.set({
          token,
          user,
          remembered_email: user.email,
          server_url: serverUrl
        });
        const items = await fetchVaultItems(token, serverUrl);
        return { success: true, user, count: items.length };
      }
      return { success: false, error: 'Missing token or user data' };
    }

    // 2. Clear session when user logs out from web dashboard
    if (request.action === 'webSessionLogout') {
      console.log('[Omnikey] User logged out from web app. Locking extension.');
      await chrome.storage.local.remove(['token', 'user']);
      return { success: true };
    }

    // 3. Check if active page has matching credentials
    if (request.action === 'checkPageCredentials') {
      const targetHost = extractDomain(request.hostname || (sender.tab ? sender.tab.url : ''));
      const matches = vaultItems.filter(item => 
        matchesDomain(targetHost, item.url, item.website)
      );

      return {
        hasMatch: matches.length > 0,
        isUnlocked,
        rememberedEmail: storage.remembered_email || (storage.user ? storage.user.email : null),
        matches: isUnlocked ? matches : matches.map(m => ({
          website: m.website,
          username: m.username || m.email || 'Saved Account'
        })),
        hostname: targetHost
      };
    }

    // 4. Unlock vault with Master Password directly (Sole Key - Multi-User Decoupled)
    if (request.action === 'unlockVault') {
      const { masterPassword, password, hostname } = request;
      const pwd = (masterPassword || password || '').trim();
      const targetHost = extractDomain(hostname || (sender.tab ? sender.tab.url : ''));

      if (!pwd) {
        return { success: false, error: 'Please enter your Master Password.' };
      }

      try {
        const res = await fetch(`${serverUrl}/auth/master-unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });

        const data = await res.json();

        if (!res.ok || !data.token) {
          return { success: false, error: data.error || 'Incorrect Master Password.' };
        }

        const userData = {
          id: data.id || data._id,
          name: data.name || data.email?.split('@')[0] || 'Omnikey User',
          email: data.email,
          token: data.token
        };

        const vaultItems = data.vault_items || [];

        await chrome.storage.local.set({
          token: data.token,
          user: userData,
          vault_items: vaultItems,
          server_url: serverUrl
        });

        const matches = vaultItems.filter(item => 
          matchesDomain(targetHost, item.url, item.website)
        );

        return {
          success: true,
          matches,
          user: userData
        };
      } catch (e) {
        console.error('[Omnikey Background] Unlock network error:', e);
        return { success: false, error: 'Cannot connect to authentication server.' };
      }
    }

    // 5. Save new account/password to Omnikey Vault
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

    // 6. Trigger autofill to active tab
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
