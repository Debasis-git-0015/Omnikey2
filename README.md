# Omnikey Administrator – AI Powered Password Manager

Omnikey Administrator is a secure, premium, production-ready password manager built using React, Vite, Tailwind CSS, Framer Motion, Express, Node.js, and MongoDB.

## Features
- **AES-256 Encryption** for passwords and vault credentials.
- **Social Authentication**: One-click **Sign in with Google**.
- **AI-Powered Password Strength Meter** & Security Score.
- **Glassmorphism Theme** (Clean Modern Minimal + Blue Accents).
- **Responsive Layout** & Smooth Animations.
- **Offline Fallback Database**: Automatically operates in offline mode (`mock_db.json`) when MongoDB is unavailable.

## Project Structure
- `/frontend` - React SPA (Vite, Tailwind, Framer Motion, React Icons)
- `/backend` - REST API (Node, Express, JWT, Mongoose, AES-256, OAuth 2.0)
- `/browser-extension` - Chrome / Edge Browser Extension for autofill

## Localhost Ports
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080/api`

---

## Setting Up Google Sign-In

Omnikey supports **Google OAuth 2.0** for one-click authentication.

### Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a new project or select an existing one.
3. Configure the **OAuth Consent Screen** (User Type: External).
4. Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
5. Select Application Type: **Web application**.
6. Set:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:8080/api/auth/oauth/google/callback`
7. Copy your **Client ID** and **Client Secret**.
8. Paste them into `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```
