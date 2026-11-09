import User from '../models/User.js';
import VaultItem from '../models/VaultItem.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
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

// @desc    Forgot Password password reset trigger
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

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
