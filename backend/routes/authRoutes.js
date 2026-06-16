import express from 'express';
import { body } from 'express-validator';
import {
  register, login, refreshToken, logout,
  getProfile, updateProfile, changePassword
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Public
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);   // ← Cookie auto-sent by browser
router.post('/logout', logout);          // ← Clears cookie

// Protected
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;