import express from 'express';
const router = express.Router();
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    createFeeStructure,
    getFeeStructures,
    updateFeeStructure,
    deleteFeeStructure,
    generateFeeChallan,
    getFeeChallans,
    collectFeePayment,
    getFeePayments,
    getFeeDefaulters,
    getFinancialStats
} from '../controllers/financialController.js';

// Fee Structure Routes
router.post('/fee-structures', authenticateToken, authorizeRoles(['admin']), createFeeStructure);
router.get('/fee-structures', authenticateToken, getFeeStructures);
router.put('/fee-structures/:id', authenticateToken, authorizeRoles(['admin']), updateFeeStructure);
router.delete('/fee-structures/:id', authenticateToken, authorizeRoles(['admin']), deleteFeeStructure);

// Fee Challan Routes
router.post('/challans', authenticateToken, authorizeRoles(['admin', 'accountant']), generateFeeChallan);
router.get('/challans', authenticateToken, getFeeChallans);

// Fee Payment Routes
router.post('/payments', authenticateToken, authorizeRoles(['admin', 'accountant']), collectFeePayment);
router.get('/payments', authenticateToken, getFeePayments);

// Fee Defaulters Routes
router.get('/defaulters', authenticateToken, authorizeRoles(['admin', 'accountant']), getFeeDefaulters);

// Financial Stats Routes
router.get('/stats', authenticateToken, authorizeRoles(['admin', 'accountant']), getFinancialStats);

export default router; 