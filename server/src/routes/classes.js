import express from 'express';
import { body } from 'express-validator';
import { auth, authorize } from '../middleware/auth.js';
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  createSection,
  updateSection,
  deleteSection
} from '../controllers/classes.js';

const router = express.Router();

// Validation middleware
const classValidation = [
  body('name').notEmpty().withMessage('Class name is required'),
  body('description').optional().trim()
];

const sectionValidation = [
  body('name').notEmpty().withMessage('Section name is required')
];

// Class routes
router.post('/', [auth, authorize('admin'), ...classValidation], createClass);
router.get('/', auth, getClasses);
router.get('/:id', auth, getClassById);
router.put('/:id', [auth, authorize('admin'), ...classValidation], updateClass);
router.delete('/:id', [auth, authorize('admin')], deleteClass);

// Section routes
router.post('/:class_id/sections', [auth, authorize('admin'), ...sectionValidation], createSection);
router.put('/sections/:id', [auth, authorize('admin'), ...sectionValidation], updateSection);
router.delete('/sections/:id', [auth, authorize('admin')], deleteSection);

export default router; 