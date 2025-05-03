import express from 'express';
const router = express.Router();
import { login, register, getProfile, updateProfile, changePassword } from '../controllers/auth.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { pool } from '../db/connection.js';

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.use(verifyToken);

// User profile routes (all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Admin only routes
router.use(checkRole(['admin']));
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, first_name, last_name FROM users ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error getting users" });
    }
});

export default router; 