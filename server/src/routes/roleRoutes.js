import express from 'express';
const router = express.Router();
import * as roleController from '../controllers/roleController.js';
import * as auth from '../middleware/auth.js';

// All routes are admin-only
router.use(auth.authenticateToken);
router.use(auth.authorizeRoles(['admin']));

// Role routes
router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Permission routes
router.get('/permissions', roleController.getAllPermissions);
router.post('/permissions', roleController.createPermission);
router.post('/assign', roleController.assignRoleToUser);
router.delete('/assign/:userId/:roleId', roleController.removeRoleFromUser);

export default router; 