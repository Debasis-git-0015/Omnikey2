import User from '../models/User.js';
import VaultItem from '../models/VaultItem.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { connectDB } from '../config/db.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_securevault_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();
  const trimmedName = (name || '').trim();

  try {
    // Ensure active MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Save directly to MongoDB Atlas
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash: password,
      provider: 'local'
    });

    console.log(`[MongoDB Atlas] New user registered successfully: ${user.email} (ID: ${user._id})`);

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Registration controller error:', error);
    let errorMessage = 'Registration failed due to database server error';
    if (!process.env.MONGODB_URI) {
      errorMessage = 'Database configuration missing. Please add MONGODB_URI in your Render environment variables.';
    } else if (error.name === 'MongooseServerSelectionError' || error.message?.includes('timed out') || error.message?.includes('whitelist')) {
      errorMessage = 'Database connection timed out. Please allow IP 0.0.0.0/0 in MongoDB Atlas Network Access.';
    }
    return res.status(500).json({ error: errorMessage });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare local master password
    if (user.passwordHash) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        return res.status(200).json({
          id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id),
        });
      }
    } else if (user.provider === 'google') {
      return res.status(400).json({
        error: 'This account was signed up via Google. Please use "Continue with Google" or reset your password.'
      });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (error) {
    console.error('Login controller error:', error);
    let errorMessage = 'Login failed due to database server error';
    if (!process.env.MONGODB_URI) {
      errorMessage = 'Database configuration missing. Please add MONGODB_URI in your Render environment variables.';
    } else if (error.name === 'MongooseServerSelectionError' || error.message?.includes('timed out') || error.message?.includes('whitelist')) {
      errorMessage = 'Database connection timed out. Please allow IP 0.0.0.0/0 in MongoDB Atlas Network Access.';
    }
    return res.status(500).json({ error: errorMessage });
  }
};

// Decryption helper for master unlock vault retrieval
const decryptSecret = () => process.env.AES_SECRET || 'super_secret_securevault_aes_key_2026';

const decryptPassword = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, decryptSecret());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext;
  } catch (err) {
    return ciphertext;
  }
};

// @desc    Authenticate and unlock vault directly by Master Password (no email required)
// @route   POST /api/auth/master-unlock
// @access  Public
export const masterUnlock = async (req, res, next) => {
  const { password, masterPassword } = req.body;
  const candidatePassword = (password || masterPassword || '').trim();

  if (!candidatePassword) {
    return res.status(400).json({ error: 'Master Password is required' });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (connErr) {
        console.warn('[masterUnlock] DB connection notice:', connErr.message);
      }
    }

    let matchedUser = null;

    // 1. Scan registered users in MongoDB Atlas (if connected)
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({ passwordHash: { $ne: null } });
      for (const user of users) {
        if (user.passwordHash) {
          const isMatch = await user.comparePassword(candidatePassword);
          if (isMatch) {
            matchedUser = user;
            break;
          }
        }
      }
    }

    // 2. Check offline mock_db.json fallback if no match found in MongoDB
    if (!matchedUser) {
      try {
        const mockDbPath = path.resolve(process.cwd(), 'backend', 'mock_db.json');
        if (fs.existsSync(mockDbPath)) {
          const mockData = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
          if (mockData.users && Array.isArray(mockData.users)) {
            for (const mu of mockData.users) {
              const hash = mu.passwordHash || mu.password;
              if (hash) {
                let match = false;
                if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
                  match = await bcrypt.compare(candidatePassword, hash);
                } else {
                  match = (candidatePassword === hash);
                }
                if (match) {
                  matchedUser = {
                    _id: mu.id || mu._id || 'mock-user-1',
                    name: mu.name || 'Omnikey User',
                    email: mu.email
                  };
                  break;
                }
              }
            }
          }
        }
      } catch (mockErr) {
        console.warn('[masterUnlock] Mock DB lookup fallback error:', mockErr.message);
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ error: 'Incorrect Master Password. Please check your password.' });
    }

    // 3. User successfully resolved! Issue JWT token
    const token = generateToken(matchedUser._id);

    // 4. Retrieve and decrypt vault items for this matched user
    let vaultItems = [];
    if (mongoose.connection.readyState === 1) {
      try {
        const items = await VaultItem.find({ user: matchedUser._id }).sort({ createdAt: -1 });
        vaultItems = items.map(item => {
          const plain = item.toObject();
          return {
            id: plain._id,
            _id: plain._id,
            website: plain.website,
            url: plain.url,
            username: plain.username,
            email: plain.email,
            password: decryptPassword(plain.password),
            category: plain.category,
            notes: decryptPassword(plain.notes)
          };
        });
      } catch (vErr) {
        console.warn('[masterUnlock] Mongo vault fetch warning:', vErr.message);
      }
    }

    // If no vault items found in Mongo, check mock_db for items belonging to this user
    if (vaultItems.length === 0) {
      try {
        const mockDbPath = path.resolve(process.cwd(), 'backend', 'mock_db.json');
        if (fs.existsSync(mockDbPath)) {
          const mockData = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
          const userIdStr = String(matchedUser._id);
          const mockItems = (mockData.vault || []).filter(v => String(v.userId || v.user) === userIdStr);
          vaultItems = mockItems.map(item => ({
            id: item.id || item._id,
            _id: item.id || item._id,
            website: item.website,
            url: item.url,
            username: item.username,
            email: item.email,
            password: decryptPassword(item.password),
            category: item.category,
            notes: decryptPassword(item.notes)
          }));
        }
      } catch (mockVaultErr) {}
    }

    console.log(`[masterUnlock] Successfully authenticated user: ${matchedUser.email} (Vault items: ${vaultItems.length})`);

    return res.status(200).json({
      success: true,
      id: matchedUser._id,
      name: matchedUser.name,
      email: matchedUser.email,
      token,
      vault_items: vaultItems
    });
  } catch (error) {
    console.error('Master unlock controller error:', error);
    return res.status(500).json({ error: 'Server error during master password verification.' });
  }
};

// Helper to resolve the correct frontend client URL dynamically (supports cloud deployments like Render)
const resolveClientUrl = (req) => {
  // If an explicit cloud CLIENT_URL is provided in env (not localhost), prioritize it
  if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost') && !process.env.CLIENT_URL.includes('127.0.0.1')) {
    return process.env.CLIENT_URL.replace(/\/+$/, '');
  }

  // 1. Check Origin header from the browser request
  const origin = req.get('origin');
  if (origin && (origin.startsWith('http://') || origin.startsWith('https://'))) {
    return origin.replace(/\/+$/, '');
  }

  // 2. Check Referer header
  const referer = req.get('referer');
  if (referer) {
    try {
      const parsed = new URL(referer);
      return `${parsed.protocol}//${parsed.host}`;
    } catch (e) {}
  }

  // 3. Fallback to Host header with proper protocol
  const host = req.get('host');
  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? (req.protocol || 'http') : 'https';
    return `${protocol}://${host}`;
  }

  return process.env.CLIENT_URL || 'http://localhost:3000';
};

// @desc    Forgot Password password reset trigger
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const clientUrl = resolveClientUrl(req);

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address' });
    }

    // Get reset token and set fields on user
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construct reset URL
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    try {
      const emailResult = await sendPasswordResetEmail({
        toEmail: user.email,
        userName: user.name,
        resetUrl
      });

      const message = `Password reset instructions sent to ${user.email}. Please check your Gmail inbox and spam folder.`;

      return res.status(200).json({
        success: true,
        message,
        deliveredTo: emailResult.deliveredTo
      });
    } catch (mailErr) {
      console.error('Email dispatch error:', mailErr);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        error: mailErr.message || 'Unable to dispatch recovery email. Please check your email service configuration.'
      });
    }
  } catch (error) {
    console.error('Forgot password controller error:', error);
    res.status(500).json({ error: 'Password recovery session failed to create' });
  }
};

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }

    // Set new password (pre-save hook will hash passwordHash)
    user.passwordHash = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your master password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ error: 'Failed to reset password due to server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  const { name, email } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = normalizedEmail;
    }

    user.name = (name || '').trim() || user.name;
    const updatedUser = await user.save();

    res.status(200).json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

// @desc    Change master password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.passwordHash) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
    }

    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: 'Server error updating password' });
  }
};

// @desc    Delete user account and all vault items
// @route   DELETE /api/auth/delete-account
// @access  Private
export const deleteAccount = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all vault items belonging to user
    await VaultItem.deleteMany({ user: req.user._id });

    // Delete user
    await user.deleteOne();

    res.status(200).json({ message: 'Account and associated vault items deleted successfully' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ error: 'Server error deleting account' });
  }
};
