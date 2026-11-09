import { describe, it, expect } from 'vitest';
import { findOrCreateOAuthUser, getOAuthConfig, devMockOAuth } from '../controllers/oauthController.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

describe('Google OAuth Unit Tests (Offline Fallback & Token Validation)', () => {
  const getDbPath = () => path.resolve('mock_db.json');

  it('should create a new Google OAuth user in mock_db when DB is offline', async () => {
    const testGoogleUser = {
      provider: 'google',
      providerId: 'google-test-id-12345',
      email: `test-oauth-${Date.now()}@gmail.com`,
      name: 'Google Test User',
      avatar: 'https://lh3.googleusercontent.com/test-avatar.jpg'
    };

    const { user, token, isNew } = await findOrCreateOAuthUser(testGoogleUser);

    expect(isNew).toBe(true);
    expect(user.email).toBe(testGoogleUser.email.toLowerCase());
    expect(user.name).toBe(testGoogleUser.name);
    expect(user.provider).toBe('google');
    expect(user.providerId).toBe(testGoogleUser.providerId);
    expect(user.avatar).toBe(testGoogleUser.avatar);

    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_securevault_jwt_key_2026');
    expect(decoded.id).toBe(user._id);

    // Verify persistence in mock_db.json
    const db = JSON.parse(fs.readFileSync(getDbPath(), 'utf8'));
    const saved = db.users.find(u => u._id === user._id);
    expect(saved).toBeDefined();
    expect(saved.email).toBe(testGoogleUser.email.toLowerCase());
  });

  it('should link Google account to existing user if email matches', async () => {
    const commonEmail = `link-test-${Date.now()}@gmail.com`;

    // First user created locally
    const first = await findOrCreateOAuthUser({
      provider: 'local',
      email: commonEmail,
      name: 'First User'
    });

    // Then signs in with Google
    const second = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: 'google-id-998877',
      email: commonEmail,
      name: 'Google Linked User',
      avatar: 'https://lh3.googleusercontent.com/avatar.jpg'
    });

    expect(second.isNew).toBe(false);
    expect(second.user._id).toBe(first.user._id);
    expect(second.user.provider).toBe('google');
    expect(second.user.providerId).toBe('google-id-998877');
  });

  it('should return Google OAuth configuration with configured flag', () => {
    let responseData = null;
    let statusCode = null;

    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          }
        };
      }
    };

    getOAuthConfig({}, res);

    expect(statusCode).toBe(200);
    expect(responseData).toHaveProperty('google');
    expect(typeof responseData.google.configured).toBe('boolean');
  });

  it('should support simulated fast-test login for Google', async () => {
    let responseData = null;
    let statusCode = null;

    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          }
        };
      }
    };

    const req = {
      body: {
        provider: 'google',
        email: `simulated-google-${Date.now()}@gmail.com`,
        name: 'Simulated User'
      }
    };

    await devMockOAuth(req, res);

    expect(statusCode).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.provider).toBe('google');
    expect(responseData).toHaveProperty('token');
  });
});
