const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', userController.login);

// Protected routes
router.use(auth.authenticateToken);

// User profile routes (all authenticated users)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Admin only routes
router.post('/users', auth.hasRole('admin'), userController.create);
router.get('/users', auth.hasRole('admin'), userController.getAll);
router.get('/users/:id', auth.hasRole('admin'), userController.getById);
router.put('/users/:id', auth.hasRole('admin'), userController.update);
router.delete('/users/:id', auth.hasRole('admin'), userController.delete);
router.post('/users/:id/reset-password', auth.hasRole('admin'), userController.resetPassword);

module.exports = router; 