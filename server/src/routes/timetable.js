import express from 'express';
import { body, query } from 'express-validator';
// import { authorize } from '../middleware/auth.js';
import {
  createTimetableSlot,
  getTimetable,
  getTeacherTimetable,
  updateTimetableSlot,
  deleteTimetableSlot,
  requestSubstitution,
  updateSubstitutionStatus,
  getSubstitutions,
} from '../controllers/timetable.js';

const router = express.Router();

// Validation middleware
const timetableSlotValidation = [
  body('day_of_week').isInt({ min: 1, max: 7 }).withMessage('Invalid day of week'),
  body('start_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid end time format (HH:MM)'),
  body('subject_id').isInt().withMessage('Invalid subject ID'),
  body('teacher_id').isInt().withMessage('Invalid teacher ID'),
  body('class_id').isInt().withMessage('Invalid class ID'),
  body('section_id').isInt().withMessage('Invalid section ID'),
  body('room_number').notEmpty().withMessage('Room number is required'),
  body('academic_year').matches(/^\d{4}-\d{4}$/).withMessage('Invalid academic year format (YYYY-YYYY)')
];

const substitutionValidation = [
  body('timetable_slot_id').isInt().withMessage('Invalid timetable slot ID'),
  body('original_teacher_id').isInt().withMessage('Invalid original teacher ID'),
  body('substitute_teacher_id').isInt().withMessage('Invalid substitute teacher ID'),
  body('substitution_date').isDate().withMessage('Invalid date format'),
  body('reason').notEmpty().withMessage('Reason is required')
];

const getTimetableValidation = [
  query('class_id').isInt().withMessage('Invalid class ID'),
  query('section_id').isInt().withMessage('Invalid section ID'),
  query('academic_year').matches(/^\d{4}-\d{4}$/).withMessage('Invalid academic year format (YYYY-YYYY)')
];

const getTeacherTimetableValidation = [
  query('teacher_id').isInt().withMessage('Invalid teacher ID'),
  query('academic_year').matches(/^\d{4}-\d{4}$/).withMessage('Invalid academic year format (YYYY-YYYY)')
];

// Timetable routes
router.post('/', [auth, authorize('admin'), ...timetableSlotValidation], createTimetableSlot);
router.get('/', [auth, ...getTimetableValidation], getTimetable);
router.get('/teacher', [auth, ...getTeacherTimetableValidation], getTeacherTimetable);
router.put('/:id', [auth, authorize('admin'), ...timetableSlotValidation], updateTimetableSlot);
router.delete('/:id', [auth, authorize('admin')], deleteTimetableSlot);

// Substitution routes
router.post('/substitutions', [auth, authorize(['admin', 'teacher']), ...substitutionValidation], requestSubstitution);
router.put('/substitutions/:id/status', [auth, authorize('admin')], updateSubstitutionStatus);
router.get('/substitutions', auth, getSubstitutions);

export default router; 