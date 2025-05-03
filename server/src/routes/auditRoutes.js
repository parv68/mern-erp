import express from 'express';
const router = express.Router();
import { getLogs, createLog } from '../controllers/auditController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

// All routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole(['admin']));

// Get audit logs (admin only)
router.get('/logs', getLogs);

// Create audit log entry (internal use, protected with admin role)
router.post('/logs', createLog);

export default router; 