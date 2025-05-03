const express = require('express');
const router = express.Router();
const {
  staffController,
  leaveController,
  payrollController,
  performanceController
} = require('../controllers/hrController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth.authenticateToken);

// Staff routes
router.get('/staff', auth.hasRole(['admin', 'hr']), staffController.getAllStaff);
router.get('/staff/:id', auth.hasRole(['admin', 'hr']), staffController.getStaffById);
router.post('/staff', auth.hasRole(['admin', 'hr']), staffController.createStaff);
router.put('/staff/:id', auth.hasRole(['admin', 'hr']), staffController.updateStaff);
router.delete('/staff/:id', auth.hasRole(['admin', 'hr']), staffController.deleteStaff);

// Department and Position routes
// These would be added here for CRUD operations on departments and positions

// Leave routes
router.get('/leave', auth.hasRole(['admin', 'hr']), leaveController.getAllLeaves);
router.get('/leave/staff/:staffId', auth.hasAnyRole, leaveController.getStaffLeaves);
router.post('/leave', auth.hasAnyRole, leaveController.createLeave);
router.patch('/leave/:id/status', auth.hasRole(['admin', 'hr']), leaveController.updateLeaveStatus);
router.get('/leave/balances/:staffId', auth.hasAnyRole, leaveController.getLeaveBalances);

// Payroll routes
router.get('/payroll', auth.hasRole(['admin', 'hr', 'finance']), payrollController.getAllPayrolls);
router.post('/payroll/generate', auth.hasRole(['admin', 'hr', 'finance']), payrollController.generatePayroll);
router.get('/payroll/staff/:staffId', auth.hasAnyRole, payrollController.getStaffPayroll);
router.patch('/payroll/:id/status', auth.hasRole(['admin', 'hr', 'finance']), payrollController.updatePayrollStatus);

// Performance Review routes
router.get('/performance-reviews', auth.hasRole(['admin', 'hr']), performanceController.getAllReviews);
router.get('/performance-reviews/employee/:staffId', auth.hasAnyRole, performanceController.getStaffReviews);
router.post('/performance-reviews', auth.hasRole(['admin', 'hr', 'principal', 'head_teacher']), performanceController.createReview);
router.put('/performance-reviews/:id', auth.hasRole(['admin', 'hr', 'principal', 'head_teacher']), performanceController.updateReview);
router.patch('/performance-reviews/:id/acknowledge', auth.hasAnyRole, performanceController.acknowledgeReview);

module.exports = router; 