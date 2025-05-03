const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');

// All routes require authentication and admin role
router.use(auth.authenticateToken);

// Get audit logs (admin only)
router.get('/audit-logs', auth.hasRole('admin'), auditController.getLogs);

// Create audit log entry (internal use, protected with admin role)
router.post('/audit-logs', auth.hasRole('admin'), auditController.createLog);

module.exports = router; 