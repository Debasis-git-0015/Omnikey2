import mongoose from 'mongoose';

let cachedDb = null;

export const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured in backend/.env');
  }

  try {
    cachedDb = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log('✅ [MongoDB Atlas] Connected successfully to database');
    return cachedDb;
  } catch (err) {
    console.error('❌ [MongoDB Atlas] Connection failed:', err.message);
    throw err;
  }
};

export default connectDB;

