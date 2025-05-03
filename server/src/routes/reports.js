const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin routes
router.get(
  '/metrics',
  authenticate,
  authorize(['admin']),
  reportsController.getAdminMetrics
);

// Teacher routes
router.get(
  '/teacher/metrics/:classId',
  authenticate,
  authorize(['teacher']),
  reportsController.getTeacherMetrics
);

router.get(
  '/teacher/reports/generate',
  authenticate,
  authorize(['teacher']),
  reportsController.generateReport
);

router.get(
  '/teacher/reports/export',
  authenticate,
  authorize(['teacher']),
  reportsController.exportReport
);

// Student/Parent routes
router.get(
  '/student/metrics',
  authenticate,
  authorize(['student', 'parent']),
  reportsController.getStudentMetrics
);

router.get(
  '/student/reports/generate',
  authenticate,
  authorize(['student', 'parent']),
  reportsController.generateReport
);

router.get(
  '/student/reports/export',
  authenticate,
  authorize(['student', 'parent']),
  reportsController.exportReport
);

// Common routes
router.get(
  '/reports/generate',
  authenticate,
  reportsController.generateReport
);

router.get(
  '/reports/export',
  authenticate,
  reportsController.exportReport
);

module.exports = router; 