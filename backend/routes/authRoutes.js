import express from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword,
  updateProfile, 
  changePassword, 
  deleteAccount 
} from '../controllers/authController.js';
import {
  getOAuthConfig,
  googleOAuthRedirect,
  googleOAuthCallback,
  devMockOAuth
} from '../controllers/oauthController.js';
import { validateBody, registerSchema, loginSchema } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Local credentials routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// OAuth 2.0 routes for Google
router.get('/oauth/config', getOAuthConfig);
router.get('/oauth/google', googleOAuthRedirect);
router.get('/oauth/google/callback', googleOAuthCallback);
router.post('/oauth/dev-mock', devMockOAuth);

// Private settings routes
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

export default router;
