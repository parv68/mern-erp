import express from 'express';
import { body } from 'express-validator';
import { login, register, getProfile, updateProfile, changePassword } from '../controllers/auth.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'hrm'])
    .withMessage('Invalid role'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required')
];

const updateProfileValidation = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Routes
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.get('/profile', auth, getProfile);
router.put('/profile', [auth, updateProfileValidation], updateProfile);
router.put('/change-password', [auth, changePasswordValidation], changePassword);

export default router; 