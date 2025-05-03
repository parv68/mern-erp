const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');

// All routes are admin-only
router.use(auth.authenticateToken);
router.use(auth.hasRole('admin'));

// Role routes
router.get('/roles', roleController.getAll);
router.get('/roles/:id', roleController.getById);
router.post('/roles', roleController.create);
router.put('/roles/:id', roleController.update);
router.delete('/roles/:id', roleController.delete);

// Permission routes
router.get('/permissions', roleController.getAllPermissions);

module.exports = router; 