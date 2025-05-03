import express from 'express';
const router = express.Router();
import { getAdminMetrics, getTeacherMetrics, getStudentMetrics, generateReport, exportReport } from '../controllers/reportsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

// Admin routes
router.get(
  '/metrics',
  authenticate,
  authorize(['admin']),
  getAdminMetrics
);

// Teacher routes
router.get(
  '/teacher/metrics/:classId',
  authenticate,
  authorize(['teacher']),
  getTeacherMetrics
);

router.get(
  '/teacher/reports/generate',
  authenticate,
  authorize(['teacher']),
  generateReport
);

router.get(
  '/teacher/reports/export',
  authenticate,
  authorize(['teacher']),
  exportReport
);

// Student/Parent routes
router.get(
  '/student/metrics',
  authenticate,
  authorize(['student', 'parent']),
  getStudentMetrics
);

router.get(
  '/student/reports/generate',
  authenticate,
  authorize(['student', 'parent']),
  generateReport
);

router.get(
  '/student/reports/export',
  authenticate,
  authorize(['student', 'parent']),
  exportReport
);

// Common routes
router.get(
  '/reports/generate',
  authenticate,
  generateReport
);

router.get(
  '/reports/export',
  authenticate,
  exportReport
);

export default router; 