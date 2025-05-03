const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
    createExamType,
    getExamTypes,
    createExamSchedule,
    getExamSchedules,
    createAssessment,
    enterMarks,
    getStudentMarks,
    generateReportCard,
    getReportCard
} = require('../controllers/examinationController');

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
    '/marks',
    authenticateToken,
    getStudentMarks
);

// Report Cards Routes
router.post(
    '/report-cards',
    authenticateToken,
    authorizeRoles(['admin', 'teacher']),
    generateReportCard
);

router.get(
    '/report-cards',
    authenticateToken,
    getReportCard
);

module.exports = router; 