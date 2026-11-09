import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

// JWT Generation Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_securevault_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// Unified helper to find or create an OAuth user in MongoDB Atlas
export const findOrCreateOAuthUser = async ({ provider, providerId, email, name, avatar }) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const safeName = (name || '').trim() || normalizedEmail.split('@')[0] || 'Omnikey User';

  // Ensure active MongoDB Atlas connection
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  // Find user in MongoDB Atlas
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    let changed = false;
    if (!user.provider || user.provider === 'local') {
      user.provider = provider;
      changed = true;
    }
    if (providerId && !user.providerId) {
      user.providerId = providerId;
      changed = true;
    }
    if (avatar && !user.avatar) {
      user.avatar = avatar;
      changed = true;
    }
    if (changed) {
      await user.save();
    }
    console.log(`[MongoDB Atlas] Existing OAuth user found: ${user.email} (ID: ${user._id})`);
    return {
      user,
      token: generateToken(user._id),
      isNew: false
    };
  }

  // Create new user directly in MongoDB Atlas
  user = await User.create({
    name: safeName,
    email: normalizedEmail,
    passwordHash: null,
    provider: provider,
    providerId: providerId || null,
    avatar: avatar || null
  });

  console.log(`[MongoDB Atlas] New OAuth user created successfully in Atlas: ${user.email} (ID: ${user._id})`);

  return {
    user,
    token: generateToken(user._id),
    isNew: true
  };
};

// Helper to determine the redirect destination in frontend
const resolveFrontendOrigin = (req, stateOrigin) => {
  if (stateOrigin) {
    try {
      const parsed = new URL(stateOrigin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch (e) {}
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      const parsed = new URL(referer);
      return parsed.origin;
    } catch (e) {}
  }

  return process.env.CLIENT_URL || 'http://localhost:5173';
};

// Helper to determine backend callback URL
const resolveCallbackUrl = (req, provider) => {
  const envCallback = process.env[`${provider.toUpperCase()}_CALLBACK_URL`];
  if (envCallback) return envCallback;

  const host = req.get('host') || 'localhost:8080';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = isLocal ? (req.protocol || 'http') : 'https';
  return `${protocol}://${host}/api/auth/oauth/${provider}/callback`;
};

// @desc    Get OAuth status and public client IDs
// @route   GET /api/auth/oauth/config
// @access  Public
export const getOAuthConfig = (req, res) => {
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  res.status(200).json({
    google: {
      configured: googleConfigured,
      clientId: googleConfigured ? process.env.GOOGLE_CLIENT_ID : null
    }
  });
};

// @desc    Initiate Google OAuth redirect
// @route   GET /api/auth/oauth/google
// @access  Public
export const googleOAuthRedirect = (req, res) => {
  const frontendOrigin = resolveFrontendOrigin(req, req.query.origin);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${frontendOrigin}/login?oauth_not_configured=google&provider=google`);
  }

  const callbackUrl = resolveCallbackUrl(req, 'google');
  const statePayload = Buffer.from(JSON.stringify({
    origin: frontendOrigin,
    timestamp: Date.now()
  })).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', statePayload);

  return res.redirect(googleAuthUrl.toString());
};

// @desc    Google OAuth Callback
// @route   GET /api/auth/oauth/google/callback
// @access  Public
export const googleOAuthCallback = async (req, res) => {
  const { code, state, error } = req.query;

  let stateOrigin = null;
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      stateOrigin = decoded.origin;
    } catch (e) {}
  }
  const frontendOrigin = resolveFrontendOrigin(req, stateOrigin);

  if (error) {
    const errorMsg = error === 'access_denied' ? 'Google sign-in was cancelled.' : `Google error: ${error}`;
    return res.redirect(`${frontendOrigin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (!code) {
    return res.redirect(`${frontendOrigin}/login?error=${encodeURIComponent('No authorization code received from Google.')}`);
  }

  try {
    const callbackUrl = resolveCallbackUrl(req, 'google');

    // Exchange authorization code for Google access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      const errDetail = tokenData.error_description || tokenData.error || 'Token exchange failed';
      console.error('Google token exchange error:', tokenData);
      return res.redirect(`${frontendOrigin}/login?error=${encodeURIComponent(`Google authentication failed: ${errDetail}`)}`);
    }

    // Fetch user profile from Google UserInfo endpoint
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const googleUser = await profileResponse.json();

    if (!profileResponse.ok || !googleUser.email) {
      console.error('Google profile fetch error:', googleUser);
      return res.redirect(`${frontendOrigin}/login?error=${encodeURIComponent('Failed to retrieve user profile from Google.')}`);
    }

    // Find or create user
    const { user, token } = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name || googleUser.given_name || googleUser.email.split('@')[0],
      avatar: googleUser.picture || null
    });

    // Redirect to frontend with authenticated session data
    const callbackRedirectUrl = new URL(`${frontendOrigin}/oauth-callback`);
    callbackRedirectUrl.searchParams.set('token', token);
    callbackRedirectUrl.searchParams.set('id', String(user._id));
    callbackRedirectUrl.searchParams.set('name', user.name);
    callbackRedirectUrl.searchParams.set('email', user.email);
    callbackRedirectUrl.searchParams.set('avatar', user.avatar || '');
    callbackRedirectUrl.searchParams.set('provider', 'google');

    return res.redirect(callbackRedirectUrl.toString());
  } catch (err) {
    console.error('Google OAuth callback unexpected error:', err);
    return res.redirect(`${frontendOrigin}/login?error=${encodeURIComponent('Internal server error during Google sign-in.')}`);
  }
};

// @desc    Fast Demo / Local Dev Simulation OAuth Sign-In
// @route   POST /api/auth/oauth/dev-mock
// @access  Public (Allowed in dev or when testing OAuth without production keys)
export const devMockOAuth = async (req, res) => {
  try {
    const { provider = 'google', email, name, avatar } = req.body;

    const sampleEmail = email || 'alex.google.user@gmail.com';
    const sampleName = name || 'Alex Mercer (Google)';
    const sampleAvatar = avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
    const sampleProviderId = 'google-mock-' + Date.now();

    const { user, token, isNew } = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: sampleProviderId,
      email: sampleEmail,
      name: sampleName,
      avatar: sampleAvatar
    });

    return res.status(200).json({
      success: true,
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      token,
      isNew,
      simulated: true,
      message: 'Signed in successfully via simulated Google provider'
    });
  } catch (err) {
    console.error('devMockOAuth error:', err);
    return res.status(500).json({ error: 'Failed to complete simulated OAuth login' });
  }
};

