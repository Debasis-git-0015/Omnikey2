import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env, root .env, or system environment (e.g. Render)
const backendEnvPath = path.resolve(__dirname, 'backend', '.env');
const rootEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// Switch working directory to backend so all relative paths resolve reliably
process.chdir(path.resolve(__dirname, 'backend'));

// Start Omnikey backend server
await import('./backend/server.js');
