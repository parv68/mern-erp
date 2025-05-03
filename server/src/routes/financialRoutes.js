const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const {
    createFeeStructure,
    getFeeStructures,
    createPayment,
    getPaymentHistory,
    createSalaryStructure,
    processSalaryPayment,
    submitReimbursement,
    approveReimbursement,
    generateFinancialReport
} = require('../controllers/financialController');

// Fee Structure Routes
router.post('/fee-structures', authenticateUser, authorizeRole(['admin', 'accountant']), createFeeStructure);
router.get('/fee-structures', authenticateUser, getFeeStructures);

// Payment Routes
router.post('/payments', authenticateUser, authorizeRole(['admin', 'accountant', 'parent']), createPayment);
router.get('/payments/student/:student_id', authenticateUser, getPaymentHistory);

// Salary Routes
router.post('/salary-structures', authenticateUser, authorizeRole(['admin', 'accountant']), createSalaryStructure);
router.post('/salary-payments', authenticateUser, authorizeRole(['admin', 'accountant']), processSalaryPayment);
router.get('/salary-payments/staff/:staff_id', authenticateUser, authorizeRole(['admin', 'accountant', 'teacher']), getPaymentHistory);

// Reimbursement Routes
router.post('/reimbursements', authenticateUser, authorizeRole(['teacher']), submitReimbursement);
router.put('/reimbursements/:id', authenticateUser, authorizeRole(['admin', 'accountant']), approveReimbursement);
router.get('/reimbursements/staff/:staff_id', authenticateUser, authorizeRole(['admin', 'accountant', 'teacher']), getPaymentHistory);

// Financial Reports
router.get('/reports', authenticateUser, authorizeRole(['admin', 'accountant']), generateFinancialReport);

module.exports = router; 