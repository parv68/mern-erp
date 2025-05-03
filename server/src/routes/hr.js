import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';

import * as staffController from '../controllers/hr/staffController.js';
import * as leaveController from '../controllers/hr/leaveController.js';
import * as payrollController from '../controllers/hr/payrollController.js';
import * as recruitmentController from '../controllers/hr/recruitmentController.js';
import * as performanceController from '../controllers/hr/performanceController.js';
import * as attendanceController from '../controllers/hr/attendanceController.js';

// Staff Management Routes
router.post('/staff',
    authenticate,
    checkRole(['admin', 'hr']),
    staffController.createStaffRecord
);
router.get('/staff',
    authenticate,
    checkRole(['admin', 'hr']),
    staffController.getAllStaffRecords
);
router.get('/staff/:staffId',
    authenticate,
    staffController.getStaffRecordById
);
router.put('/staff/:staffId',
    authenticate,
    checkRole(['admin', 'hr']),
    staffController.updateStaffRecord
);
router.delete('/staff/:staffId',
    authenticate,
    checkRole(['admin']),
    staffController.deleteStaffRecord
);

// Staff Attendance Routes
router.get('/attendance',
    authenticate,
    checkRole(['admin', 'hr']),
    attendanceController.getAllAttendance
);
router.get('/staff/:staffId/attendance',
    authenticate,
    attendanceController.getStaffAttendance
);
router.post('/attendance',
    authenticate,
    checkRole(['admin', 'hr']),
    attendanceController.createAttendance
);
router.put('/attendance/:attendanceId',
    authenticate,
    checkRole(['admin', 'hr']),
    attendanceController.updateAttendance
);
router.delete('/attendance/:attendanceId',
    authenticate,
    checkRole(['admin', 'hr']),
    attendanceController.deleteAttendance
);
router.get('/attendance/summary',
    authenticate,
    attendanceController.getAttendanceSummary
);
router.post('/attendance/bulk',
    authenticate,
    checkRole(['admin', 'hr']),
    attendanceController.bulkMarkAttendance
);
router.get('/attendance/working-hours',
    authenticate,
    checkRole(['admin', 'hr']),
    attendanceController.getWorkingHoursSummary
);

// Leave Management Routes
router.post('/leave-types',
    authenticate,
    checkRole(['admin', 'hr']),
    leaveController.createLeaveType
);
router.get('/leave-types',
    authenticate,
    leaveController.getLeaveTypes
);
router.post('/leave-applications',
    authenticate,
    leaveController.applyLeave
);
router.get('/leave-applications',
    authenticate,
    leaveController.getLeaveApplications
);
router.put('/leave-applications/:leaveId',
    authenticate,
    checkRole(['admin', 'hr']),
    leaveController.processLeaveApplication
);
router.get('/staff/:staffId/leave-balance',
    authenticate,
    leaveController.getLeaveBalance
);

// Payroll Routes
router.post('/payroll',
    authenticate,
    checkRole(['admin', 'hr', 'accountant']),
    payrollController.generatePayroll
);
router.get('/payroll/staff/:staffId',
    authenticate,
    payrollController.getStaffPayroll
);
router.get('/payroll',
    authenticate,
    checkRole(['admin', 'hr', 'accountant']),
    payrollController.getAllPayroll
);
router.post('/payroll/:payrollId/process',
    authenticate,
    checkRole(['admin', 'accountant']),
    payrollController.processPayment
);
router.get('/payroll/summary',
    authenticate,
    checkRole(['admin', 'hr', 'accountant']),
    payrollController.getPayrollSummary
);

// Recruitment Routes
router.post('/jobs',
    authenticate,
    checkRole(['admin', 'hr']),
    recruitmentController.createJobOpening
);
router.get('/jobs',
    authenticate,
    recruitmentController.getJobOpenings
);
router.put('/jobs/:jobId/status',
    authenticate,
    checkRole(['admin', 'hr']),
    recruitmentController.updateJobStatus
);
router.post('/jobs/:jobId/applications',
    recruitmentController.submitApplication
);
router.get('/jobs/:jobId/applications',
    authenticate,
    checkRole(['admin', 'hr']),
    recruitmentController.getJobApplications
);
router.put('/applications/:applicationId/status',
    authenticate,
    checkRole(['admin', 'hr']),
    recruitmentController.updateApplicationStatus
);
router.get('/recruitment/stats',
    authenticate,
    checkRole(['admin', 'hr']),
    recruitmentController.getRecruitmentStats
);

// Performance Review Routes
router.post('/reviews',
    authenticate,
    checkRole(['admin', 'hr', 'supervisor']),
    performanceController.createReview
);
router.get('/staff/:staffId/reviews',
    authenticate,
    performanceController.getStaffReviews
);
router.get('/reviews/:reviewId',
    authenticate,
    performanceController.getReviewById
);
router.put('/reviews/:reviewId',
    authenticate,
    checkRole(['admin', 'hr', 'supervisor']),
    performanceController.updateReview
);
router.post('/reviews/:reviewId/submit',
    authenticate,
    checkRole(['admin', 'hr', 'supervisor']),
    performanceController.submitReview
);
router.post('/reviews/:reviewId/acknowledge',
    authenticate,
    performanceController.acknowledgeReview
);
router.get('/performance/stats',
    authenticate,
    checkRole(['admin', 'hr']),
    performanceController.getPerformanceStats
);

export default router; 