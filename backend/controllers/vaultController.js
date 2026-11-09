import VaultItem from '../models/VaultItem.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';
import { connectDB } from '../config/db.js';

// Encryption Helpers
const getSecret = () => {
  return process.env.AES_SECRET || 'super_secret_securevault_aes_key_2026';
};

const encrypt = (text) => {
  if (!text) return text;
  try {
    return CryptoJS.AES.encrypt(text, getSecret()).toString();
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
};

const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, getSecret());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext; // Fallback if decrypted is empty (e.g. plaintext)
  } catch (err) {
    // If decryption fails, return as-is (useful for plaintext database legacy data)
    return ciphertext;
  }
};


export const getVaultItems = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const items = await VaultItem.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    // Decrypt credentials
    const decryptedItems = items.map(item => {
      const plain = item.toObject();
      return {
        ...plain,
        password: decrypt(plain.password),
        notes: decrypt(plain.notes)
      };
    });

    return res.status(200).json(decryptedItems);
  } catch (error) {
    console.error('getVaultItems error:', error);
    return res.status(500).json({ error: 'Server error retrieving vault items from database' });
  }
};

// @desc    Create new vault item
// @route   POST /api/vault
// @access  Private
export const createVaultItem = async (req, res, next) => {
  const { website, url, username, email, password, notes, category } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const encryptedPassword = encrypt(password);
    const encryptedNotes = encrypt(notes);

    const item = await VaultItem.create({
      user: req.user._id,
      website,
      url,
      username,
      email,
      password: encryptedPassword,
      notes: encryptedNotes,
      category: category || 'Logins'
    });

    return res.status(201).json({
      _id: item._id,
      id: item._id,
      user: item.user,
      website: item.website,
      url: item.url,
      username: item.username,
      email: item.email,
      password: password,
      notes: notes,
      category: item.category,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    });
  } catch (error) {
    console.error('createVaultItem error:', error);
    return res.status(500).json({ error: 'Failed to save vault item to database' });
  }
};

// @desc    Update vault item
// @route   PUT /api/vault/:id
// @access  Private
export const updateVaultItem = async (req, res, next) => {
  const { id } = req.params;
  const { website, url, username, email, password, notes, category } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const encryptedPassword = password !== undefined ? encrypt(password) : undefined;
    const encryptedNotes = notes !== undefined ? encrypt(notes) : undefined;

    let item = await VaultItem.findOne({ _id: id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    item.website = website !== undefined ? website : item.website;
    item.url = url !== undefined ? url : item.url;
    item.username = username !== undefined ? username : item.username;
    item.email = email !== undefined ? email : item.email;
    if (encryptedPassword !== undefined) item.password = encryptedPassword;
    if (encryptedNotes !== undefined) item.notes = encryptedNotes;
    item.category = category !== undefined ? category : item.category;

    const updatedItem = await item.save();
    const plain = updatedItem.toObject();
    
    return res.status(200).json({
      ...plain,
      password: password !== undefined ? password : decrypt(plain.password),
      notes: notes !== undefined ? notes : decrypt(plain.notes)
    });
  } catch (error) {
    console.error('updateVaultItem error:', error);
    return res.status(500).json({ error: 'Server error updating vault item' });
  }
};

// @desc    Delete vault item
// @route   DELETE /api/vault/:id
// @access  Private
export const deleteVaultItem = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const item = await VaultItem.findOneAndDelete({ _id: id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    return res.status(200).json({ message: 'Vault item deleted successfully' });
  } catch (error) {
    console.error('deleteVaultItem error:', error);
    return res.status(500).json({ error: 'Server error deleting vault item' });
  }
};

// @desc    Purge all vault items for user
// @route   DELETE /api/vault/purge
// @access  Private
export const purgeVaultItems = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    await VaultItem.deleteMany({ user: req.user._id });
    return res.status(200).json({ message: 'Vault purged successfully' });
  } catch (error) {
    console.error('purgeVaultItems error:', error);
    return res.status(500).json({ error: 'Server error purging vault items' });
  }
};
