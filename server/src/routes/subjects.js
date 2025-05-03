import express from 'express';
import { body } from 'express-validator';
import { auth, authorize } from '../middleware/auth.js';
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  allocateTeacher,
  deallocateTeacher
} from '../controllers/subjects.js';

const router = express.Router();

// Validation middleware
const subjectValidation = [
  body('name').notEmpty().withMessage('Subject name is required'),
  body('code').notEmpty().withMessage('Subject code is required'),
  body('description').optional().trim()
];

const allocationValidation = [
  body('subject_id').isInt().withMessage('Invalid subject ID'),
  body('teacher_id').isInt().withMessage('Invalid teacher ID'),
  body('class_id').isInt().withMessage('Invalid class ID'),
  body('section_id').isInt().withMessage('Invalid section ID'),
  body('academic_year').matches(/^\d{4}-\d{4}$/).withMessage('Invalid academic year format (YYYY-YYYY)')
];

// Subject routes
router.post('/', [auth, authorize('admin'), ...subjectValidation], createSubject);
router.get('/', auth, getSubjects);
router.get('/:id', auth, getSubjectById);
router.put('/:id', [auth, authorize('admin'), ...subjectValidation], updateSubject);
router.delete('/:id', [auth, authorize('admin')], deleteSubject);

// Subject Teacher Allocation routes
router.post('/allocate', [auth, authorize('admin'), ...allocationValidation], allocateTeacher);
router.delete('/allocate/:id', [auth, authorize('admin')], deallocateTeacher);

export default router; 