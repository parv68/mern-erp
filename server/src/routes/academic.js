import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { upload } from '../middleware/fileUpload.js';
import {
    createClass,
    getClasses,
    assignTeacher,
    uploadStudyMaterial,
    createTimetableSlot,
    getClassTimetable,
    requestScheduleChange,
    markSubstitution
} from '../controllers/academicController.js';

const router = express.Router();

// Class Management Routes
router.post('/classes', authenticate, checkRole(['admin']), createClass);
router.get('/classes', authenticate, getClasses);
router.post('/classes/assign-teacher', authenticate, checkRole(['admin']), assignTeacher);

// Study Materials Routes
router.post(
    '/study-materials',
    authenticate,
    checkRole(['teacher']),
    upload.single('file'),
    uploadStudyMaterial
);
router.get('/study-materials/:class_id', authenticate, getStudyMaterials);

// Timetable Management Routes
router.post('/timetable', authenticate, checkRole(['admin']), createTimetableSlot);
router.get('/timetable/:class_id', authenticate, getClassTimetable);
router.post(
    '/timetable/schedule-change',
    authenticate,
    checkRole(['teacher']),
    requestScheduleChange
);
router.post(
    '/timetable/substitution',
    authenticate,
    checkRole(['teacher']),
    markSubstitution
);

export default router; 