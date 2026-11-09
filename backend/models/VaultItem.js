import mongoose from 'mongoose';

const vaultItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User owner is required']
  },
  website: {
    type: String,
    required: [true, 'Website name is required'],
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Encrypted password payload is required']
  },
  notes: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category identifier is required'],
    default: 'Logins',
    enum: ['Logins', 'Finance', 'Cards', 'Secure Notes']
  }
}, {
  timestamps: true
});

const VaultItem = mongoose.model('VaultItem', vaultItemSchema);
export default VaultItem;
