import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import vaultRoutes from './routes/vaultRoutes.js';

// Setup reliable __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to reliably find workspace files regardless of cwd
const resolveWorkspaceFile = (relPath) => {
  const candidates = [
    path.resolve(__dirname, '..', relPath),
    path.resolve(process.cwd(), relPath),
    path.resolve(process.cwd(), '..', relPath)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
};

// Load environment variables (supports running from repo root or backend folder)
dotenv.config();
const localEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

const app = express();
const PORT = process.env.PORT || 8080;

// One-time sync from legacy mock_db.json into MongoDB Atlas so no user is lost
const syncMockDbToAtlas = async () => {
  try {
    const mockDbFile = resolveWorkspaceFile('backend/mock_db.json');
    if (!fs.existsSync(mockDbFile)) return;
    const raw = fs.readFileSync(mockDbFile, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) return;

    for (const mockUser of parsed.users) {
      const email = (mockUser.email || '').toLowerCase().trim();
      if (!email || email.includes('test-oauth') || email.includes('link-test') || email.includes('simulated-google')) continue;
      
      const existing = await User.findOne({ email });
      if (!existing) {
        console.log(`[Auto-Migration] Syncing user "${email}" from mock_db to MongoDB Atlas...`);
        await User.create({
          name: mockUser.name || email.split('@')[0],
          email,
          passwordHash: mockUser.passwordHash || null,
          provider: mockUser.provider || 'local',
          providerId: mockUser.providerId || null,
          avatar: mockUser.avatar || null
        });
      }
    }
  } catch (err) {
    console.warn('Mock DB sync notice:', err.message);
  }
};

// Express Trust Proxy (Required for reverse proxies like Render to detect HTTPS & client IPs)
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev to avoid blocking
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Database connection assurance middleware for all API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('Database connection error in request middleware:', err.message);
    }
  }
  next();
});

// Rate Limiter (disabled in testing environment)
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);
}

// Status / Health Check route
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Omnikey Administrator Backend API is running successfully',
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Extension zip download route
app.get('/api/extension/download', (req, res) => {
  const zipPath = resolveWorkspaceFile('frontend/public/omnikey-autofill-extension.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="omnikey-autofill-extension.zip"');
    return res.sendFile(path.resolve(zipPath));
  }
  res.status(404).json({ error: 'Extension package not found. Please re-generate.' });
});

// Extension verification test page route
app.get('/test-page', (req, res) => {
  const testPagePath = resolveWorkspaceFile('browser-extension/test-page.html');
  if (fs.existsSync(testPagePath)) {
    return res.sendFile(path.resolve(testPagePath));
  }
  res.status(404).send('Test page not found.');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);

// Serve static frontend build if present (enables turnkey full-stack hosting on Render)
const frontendDist = resolveWorkspaceFile('frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/test-page')) {
      return next();
    }
    res.sendFile(path.resolve(frontendDist, 'index.html'));
  });
}

// Conditionally listen if not executing in serverless Vercel function or testing suite
if (process.env.NODE_ENV !== 'test' && (process.env.NODE_ENV !== 'production' || !process.env.VERCEL)) {
  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Omnikey Administrator backend server running on port ${PORT}`);
    try {
      await connectDB();
      await syncMockDbToAtlas();
    } catch (err) {
      console.error('Failed to initialize database on startup:', err.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[ERROR] Port ${PORT} is already in use by another process.`);
      console.error(`To free port ${PORT} on Windows, run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
    } else {
      console.error('Server error:', err);
    }
  });
}

export default app;
