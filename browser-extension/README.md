# 🔐 Omnikey Password Manager - Browser Extension

A modern, secure browser extension built with **Manifest V3** for automatic credential autofill on websites like **GitHub**, **Google**, **Twitter**, and custom domains.

---

## 📁 Directory Structure

```
browser-extension/
├── manifest.json       # Manifest V3 extension configuration
├── popup.html          # Extension popup user interface (Sleek dark theme)
├── popup.css           # Glassmorphic styling matching Omnikey UI
├── popup.js            # Authentication, domain matching, and message sender
├── content.js          # Injected script detecting & filling forms on active tabs
├── content.css         # In-page toast feedback styling
├── background.js       # Background service worker & context menu support
├── test-page.html      # Test login page for verifying autofill functionality
└── icons/              # Extension icons (16x16, 48x48, 128x128)
```

---

## 🚀 How to Install in Your Browser

### Google Chrome / Brave / Microsoft Edge:

1. Open your browser and navigate to **Extensions manager**:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable **Developer Mode** (toggle switch in the top-right corner).
3. Click the **"Load unpacked"** button.
4. Select the `passwordmanager/browser-extension` folder.
5. The **Omnikey Password Manager & Autofill** extension icon will appear in your browser toolbar! 📌 Pin it for easy access.

---

## ⚡ How to Use

1. **Start the Password Manager Backend** (if running locally):
   ```bash
   cd backend
   npm run dev
   ```
2. **Open the Extension**:
   - Click the Omnikey icon in your toolbar.
   - Unlock the vault by entering your registered **Email** and **Master Password**.
3. **Autofill on Websites (e.g. GitHub)**:
   - Navigate to `https://github.com/login` (or open `browser-extension/test-page.html`).
   - Click the Omnikey extension icon.
   - It automatically detects `github.com` and displays matching saved credentials at the top.
   - Click the **⚡ Autofill** button.
   - Username, email, and password will be instantly filled into the form fields with animated feedback!
4. **Right-Click Context Menu**:
   - You can also right-click any login input field on a web page and select **"⚡ Autofill with Omnikey"**.

---

## 🛠️ Configuration

- Default Backend API: `http://localhost:8080/api`
- You can change the backend URL directly inside the extension popup under **Server Settings**.
