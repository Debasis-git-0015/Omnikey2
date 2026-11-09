# 🔐 Omnikey — Zero-Knowledge Cloud Password Manager & Smart Autofill

[![Live Deployment](https://img.shields.io/badge/Render-Live%20Production-success?logo=render&logoColor=white)](https://omnikey4.onrender.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Node%20%2B%20Express%204-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas%20Cluster-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Manifest V3](https://img.shields.io/badge/Extension-Chrome%20Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Security](https://img.shields.io/badge/Encryption-AES--256%20%2B%20bcrypt-blueviolet)](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)

**Omnikey** is a full-stack, enterprise-grade password management ecosystem combining a zero-knowledge web application, a multi-tenant cloud REST API, and a clean **Google-style Manifest V3 browser extension** with 1-click in-page autofill and automatic credential capture across all external websites.

* **Live Cloud Application**: [**https://omnikey4.onrender.com**](https://omnikey4.onrender.com)
* **Interactive Extension Test Arena**: [**https://omnikey4.onrender.com/test-page**](https://omnikey4.onrender.com/test-page)
* **Direct Extension Package Download**: [**https://omnikey4.onrender.com/api/extension/download**](https://omnikey4.onrender.com/api/extension/download)

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Repository Structure](#-repository-structure)
5. [Environment Variables](#-environment-variables)
6. [Local Development Setup](#-local-development-setup)
7. [Browser Extension Installation Guide](#-browser-extension-installation-guide)
8. [Cloud Deployment (Render & Atlas)](#-cloud-deployment-render--atlas)
9. [API Endpoint Reference](#-api-endpoint-reference)
10. [Security & Cryptography Model](#-security--cryptography-model)
11. [Presentation & PPTX Assets](#-presentation--pptx-assets)

---

## 🚀 Core Features

### 1. Zero-Knowledge Cryptographic Vault
* **Symmetric AES-256 Field Encryption**: Passwords and secure notes are encrypted into Base64 ciphertexts before hitting database disks.
* **bcrypt Key Derivation**: Master passwords are irreversibly salted and hashed with 10 work factor rounds (`$2a$10$...`).
* **Decoupled Plaintext Exposure**: Server-side decryption occurs ephemerally in-memory only during authenticated query lifecycles (`/api/vault`).

### 2. Manifest V3 Browser Extension (Smart Autofill)
* **Google-Style Clean Light Theme**: Styled after Google Password Manager with Google Blue (`#1A73E8`) accents, clean typography, and Material elevations.
* **Master-Password-Centric Unlock**: Unlocks using **only the Master Password**; the backend scans and resolves the corresponding user account automatically without manual email entry.
* **1-Click In-Page Autofill**: Automatically detects domain matches and surfaces a floating Google-style prompt card. Dispatches synthetic `input`, `change`, and `keyup` events to support React, Angular, and Vue forms.
* **Automatic Registration Capture**: Detects form submissions across any external website and prompts: *"Save password to Omnikey?"*. Clicking Save records the credential to your encrypted cloud vault.
* **Own-Domain Suppression**: Automatically detects Omnikey's own domains (`omnikey4.onrender.com`, `localhost`) to prevent capturing or prompting for the master password.
* **Web Session Auto-Sync**: Seamlessly syncs sessions when users log in to the web dashboard.

### 3. Identity Federation & Recovery
* **Google OAuth 2.0 Integration**: One-click social sign-in with server-side authorization code exchange and dynamic HTTPS callback enforcement.
* **Brevo (Sendinblue) HTTPS REST API**: Fast, reliable transactional email dispatcher delivering password reset links over HTTPS port 443 without SMTP port restrictions.
* **Dynamic Origin Detection**: Request header inspection ensures password reset emails always link to the live production domain (`https://omnikey4.onrender.com`) rather than localhost.

### 4. Active Vault Auditing & Intelligence
* **Security Center**: Live 0–100% health score auditing weak, duplicate, compromised, and stale passwords.
* **CSPRNG Password Generator**: Entropy evaluation powered by `window.crypto.getRandomValues()` with crack-time calculations.
* **Breach Intelligence Scanner**: Scans user identities against known data breaches with actionable mitigation recommendations.

---

## 🏛 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                │
│   ┌──────────────────────────────────┐  ┌───────────────────────────┐   │
│   │     React 18 Single-Page App     │  │  Manifest V3 Extension    │   │
│   │  (Vite, Tailwind, Framer Motion) │  │ (Service Worker + Script) │   │
│   └─────────────────┬────────────────┘  └─────────────┬─────────────┘   │
└─────────────────────┼─────────────────────────────────┼─────────────────┘
                      │ HTTPS / JSON REST API           │
┌─────────────────────▼─────────────────────────────────▼─────────────────┐
│                       GATEWAY & APPLICATION TIER                        │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │   Express 4 Server (Reverse Proxy Hardened, Helmet, Rate Limit) │   │
│   ├───────────────────────────────┬─────────────────────────────────┤   │
│   │   /api/auth (Login, OAuth)    │   /api/vault (AES-256 CRUD)     │   │
│   ├───────────────────────────────┼─────────────────────────────────┤   │
│   │   /api/auth/master-unlock     │   Brevo v3 REST API Dispatcher  │   │
│   └───────────────────────────────┴─────────────────────────────────┘   │
└─────────────────────┬─────────────────────────────────┬─────────────────┘
                      │ Mongoose Driver                 │ HTTPS Port 443
┌─────────────────────▼────────────────┐  ┌─────────────▼─────────────────┐
│     DATA & CLOUD IDENTITY TIER       │  │       EXTERNAL CLOUD API      │
│  MongoDB Atlas Distributed Cluster   │  │  • Brevo Transactional Email │
│  (M0 Multi-Zone High Availability)   │  │  • Google Cloud OAuth 2.0    │
└──────────────────────────────────────┘  └───────────────────────────────┘
```

---

## 🛠 Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Web App** | React 18, Vite 8, Tailwind CSS, Framer Motion, Axios, React Icons, Zod |
| **Backend API** | Node.js (ES Modules), Express 4, Mongoose, Helmet, Express-Rate-Limit, CORS |
| **Browser Extension** | Chrome / Edge Manifest V3, Service Workers, DOM Content Scripts, Chrome Storage |
| **Cryptography** | CryptoJS (AES-256-CBC), bcryptjs (Salt rounds: 10), crypto (SHA-256, CSPRNG) |
| **Database** | MongoDB Atlas Distributed Multi-Zone Cluster |
| **Cloud Hosting** | Render PaaS (Linux Container, Reverse Proxy / Express Trust Proxy) |
| **Email Service** | Brevo (Sendinblue) v3 REST API over HTTPS port 443 |
| **Authentication** | JWT (JSON Web Tokens), Google OAuth 2.0 Authorization Code Flow |

---

## 📂 Repository Structure

```
passwordmanager/
├── backend/
│   ├── config/
│   │   └── db.js                 # Cached MongoDB Mongoose connection manager
│   ├── controllers/
│   │   ├── authController.js     # Auth, Login, Master-Unlock, Password Reset
│   │   ├── oauthController.js    # Google OAuth 2.0 flow & HTTPS redirect resolver
│   │   └── vaultController.js    # AES-256 encrypted vault CRUD controllers
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer token authorization guard
│   │   └── validationMiddleware.js # Zod runtime request body validator
│   ├── models/
│   │   ├── User.js               # User schema with bcrypt pre-save hook
│   │   └── VaultItem.js          # Relational vault schema referencing User._id
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   └── vaultRoutes.js        # /api/vault routes
│   ├── services/
│   │   └── emailService.js       # Brevo v3 HTTPS REST API transactional email sender
│   └── server.js                 # Backend server entry & static SPA fallback
├── browser-extension/
│   ├── icons/                    # 16px, 48px, 128px extension icons
│   ├── background.js             # Manifest V3 service worker & vault caching
│   ├── content.js                # DOM injection, autofill & registration capture
│   ├── content.css               # Google-style floating in-page cards
│   ├── manifest.json             # Manifest V3 configuration & permissions
│   ├── popup.html                # Google Password Manager light theme popup
│   ├── popup.css                 # Clean Google Material light styling
│   ├── popup.js                  # Master-password unlock popup controller
│   └── test-page.html            # Verification arena for testing autofill & save
├── frontend/
│   ├── public/
│   │   └── omnikey-autofill-extension.zip # Packaged ready-to-install extension
│   ├── src/
│   │   ├── components/           # AppLayout, ExtensionModal, OAuthButtons, etc.
│   │   ├── config/api.js         # Dynamic API origin resolver
│   │   ├── context/AuthContext.jsx # Central state & Axios interceptors
│   │   ├── pages/                # Vault, Dashboard, SecurityCenter, Generator, etc.
│   │   └── App.jsx               # React Router routes
│   └── package.json
├── server.js                     # Root entry point importing ./backend/server.js
├── render.yaml                   # Render Blueprint infrastructure configuration
├── package.json                  # Root monorepo build & start orchestration
└── README.md                     # Comprehensive technical documentation
```

---

## 🔑 Environment Variables

To run the application locally or in production, configure the following variables in `backend/.env` (or in the Render Dashboard under **Environment**):

| Key | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `8080` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/omnikey?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for signing JWT session tokens | `super_secret_securevault_jwt_key_2026` |
| `AES_SECRET` | Master key for AES-256 vault encryption | `super_secret_securevault_aes_key_2026` |
| `CLIENT_URL` | Root web client origin | `https://omnikey4.onrender.com` (or `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth 2.0 Web Client ID | `your_google_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth 2.0 Client Secret | `GOCSPX-your_google_client_secret` |
| `BREVO_API_KEY` | Brevo v3 Transactional Email API Key | `xkeysib-your_brevo_api_key_here` |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo | `your_account@gmail.com` |
| `BREVO_SENDER_NAME` | Display name for recovery emails | `Omnikey Security` |

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Local instance or free MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Debasis-git-0015/Omnikey2.git
cd Omnikey2

# Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment File
Create `backend/.env` based on `.env.example`:
```bash
cp .env.example backend/.env
```
Update `MONGODB_URI`, `JWT_SECRET`, and `AES_SECRET` with your credentials.

### 3. Run Development Servers
* **Option A: Run Full Stack Simultaneously**
  ```bash
  # Terminal 1: Backend API (Port 8080)
  npm --prefix backend start

  # Terminal 2: Frontend Web App (Port 3000)
  npm --prefix frontend run dev
  ```
* **Option B: Run Production Monorepo Build Locally**
  ```bash
  npm run build
  npm start
  # Open http://localhost:8080
  ```

---

## 🧩 Browser Extension Installation Guide

The Omnikey browser extension works across **Google Chrome**, **Microsoft Edge**, and **Brave**.

### Installation Steps
1. **Download the Extension Archive**:
   * Download directly from your live server: [**https://omnikey4.onrender.com/api/extension/download**](https://omnikey4.onrender.com/api/extension/download)
   * Or use the packaged zip: `frontend/public/omnikey-autofill-extension.zip`.
2. **Extract the ZIP Archive**:
   * Right-click the `.zip` file and extract it into a folder named `browser-extension`.
3. **Load in Chrome / Edge / Brave**:
   * Open your browser and navigate to `chrome://extensions` (or `edge://extensions`).
   * Turn **ON** the **Developer mode** toggle in the top-right corner.
   * Click **Load unpacked** in the top-left corner.
   * Select the extracted `browser-extension` folder.
4. **Test the Extension**:
   * Navigate to the built-in [**Verification Test Arena**](https://omnikey4.onrender.com/test-page).
   * Open the popup, enter your Master Password, and verify that matching credentials pop up and autofill automatically!

---

## ☁️ Cloud Deployment (Render & Atlas)

The project includes pre-configured deployment blueprints for [Render](https://render.com).

### Render Deployment Instructions
1. Connect your GitHub repository to Render as a **Web Service**.
2. Set the following configurations:
   * **Runtime**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
3. In the **Environment** tab, populate:
   * `MONGODB_URI`
   * `JWT_SECRET`
   * `AES_SECRET`
   * `CLIENT_URL` = `https://<your-app>.onrender.com`
   * `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   * `BREVO_API_KEY` & `BREVO_SENDER_EMAIL`

### MongoDB Atlas Firewall Configuration
Because Render uses dynamic IP addresses, you must configure network access:
1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Security** &rarr; **Network Access**.
3. Click **Add IP Address** &rarr; select **Allow Access from Anywhere (`0.0.0.0/0`)**.

### Google Cloud OAuth Configuration
1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Select your OAuth 2.0 Web Client and add:
   * **Authorized JavaScript origins**: `https://<your-app>.onrender.com`
   * **Authorized redirect URIs**: `https://<your-app>.onrender.com/api/auth/oauth/google/callback`

---

## 📡 API Endpoint Reference

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account with master password | Public |
| `POST` | `/api/auth/login` | Authenticate user with email and master password | Public |
| `POST` | `/api/auth/master-unlock` | Direct unlock using only master password (Extension) | Public |
| `POST` | `/api/auth/forgot-password` | Dispatch recovery email via Brevo REST API | Public |
| `POST` | `/api/auth/reset-password/:token`| Reset master password using single-use token | Public |
| `GET` | `/api/auth/oauth/google` | Initiate Google OAuth 2.0 redirect | Public |
| `GET` | `/api/auth/oauth/google/callback`| Handle Google OAuth code exchange | Public |

### Vault Endpoints (`/api/vault`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vault` | Retrieve and decrypt all vault items for user | Private (JWT) |
| `POST` | `/api/vault` | Encrypt and store new vault credential | Private (JWT) |
| `PUT` | `/api/vault/:id` | Update and re-encrypt an existing vault item | Private (JWT) |
| `DELETE`| `/api/vault/:id` | Delete a vault credential by ID | Private (JWT) |

### System & Health Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | Runtime health check (DB connectivity & OAuth status) | Public |
| `GET` | `/api/extension/download` | Download latest browser extension zip package | Public |
| `GET` | `/test-page` | In-page autofill verification test arena | Public |

---

## 🔒 Security & Cryptography Model

```
Raw Master Password ────────► bcrypt.hash(saltRounds=10) ────────► passwordHash ($2a$10$...)
                                                                     (Stored in User DB)

Raw Vault Password  ────────► CryptoJS.AES.encrypt(raw, SECRET) ──► Ciphertext (Base64)
                                                                     (Stored in Vault DB)

Recovery Session    ────────► crypto.randomBytes(32) ────────────► SHA-256 Token (60m TTL)
```

1. **Zero-Knowledge Guarantee**: The server does not store or log master passwords. Vault passwords cannot be decrypted without the secret key.
2. **Reverse Proxy Security**: Configured with `helmet()` and `app.set('trust proxy', 1)` to prevent header spoofing and enforce strict transport security.
3. **Rate Limiting**: Throttles brute-force attempts on authentication routes to 100 requests per 15-minute window.

---

## 📊 Presentation & PPTX Assets

A 15-slide PowerPoint deck covering System Design, Database Modeling, Technical Implementation, Module Integration, and Weekly Progress is included:

* **File Location**: [`Omnikey_Project_Presentation.pptx`](file:///c:/Users/debas/OneDrive/Desktop/passwordmanager/Omnikey_Project_Presentation.pptx)
* **Re-generation Script**: [`generate_presentation.py`](file:///c:/Users/debas/OneDrive/Desktop/passwordmanager/generate_presentation.py)
  ```bash
  python generate_presentation.py
  ```

---

## 👥 Contributors & License
* **Lead Engineer**: Debasis Sukla ([@Debasis-git-0015](https://github.com/Debasis-git-0015))
* **License**: MIT License — open for academic, personal, and commercial adaptation.
