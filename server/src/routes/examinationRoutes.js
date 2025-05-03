import express from 'express';
const router = express.Router();
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    createExamType,
    getExamTypes,
    createExamSchedule,
    getExamSchedules,
    createAssessment,
    enterMarks,
    getStudentMarks,
    generateReportCard,
    getReportCard
} from '../controllers/examinationController.js';

// Exam Types Routes
router.post(
    '/types',
    authenticateToken,
    authorizeRoles(['admin']),
    createExamType
);

router.get(
    '/types',
    authenticateToken,
    getExamTypes
);

// Exam Schedules Routes
router.post(
    '/schedules',
    authenticateToken,
    authorizeRoles(['admin']),
    createExamSchedule
);

router.get(
    '/schedules',
    authenticateToken,
    getExamSchedules
);

// Assessments Routes
router.post(
    '/assessments',
    authenticateToken,
    authorizeRoles(['admin', 'teacher']),
    createAssessment
);

// Student Marks Routes
router.post(
    '/marks',
    authenticateToken,
    authorizeRoles(['admin', 'teacher']),
    enterMarks
);

router.get(
    '/marks/student/:studentId',
    authenticateToken,
    getStudentMarks
);

// Report Cards Routes
router.post(
    '/report-cards/generate',
    authenticateToken,
    authorizeRoles(['admin', 'teacher']),
    generateReportCard
);

router.get(
    '/report-cards/:studentId',
    authenticateToken,
    getReportCard
);

export default router; 