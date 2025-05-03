import { pool } from '../db/connection.js';
import { validateFeeData, validatePayment } from '../utils/validators.js';

// Fee Structure Controllers
export const createFeeStructure = async (req, res) => {
    try {
        const { class_id, fee_type, amount, frequency, academic_year } = req.body;
        
        if (!validateFeeData({ student_id: class_id, amount, fee_type, due_date: academic_year })) {
            return res.status(400).json({ message: 'Invalid fee structure data' });
        }

        const result = await pool.query(
            'INSERT INTO fee_structures (class_id, fee_type, amount, frequency, academic_year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [class_id, fee_type, amount, frequency, academic_year]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating fee structure:', error);
        res.status(500).json({ message: 'Failed to create fee structure' });
    }
};

export const getFeeStructures = async (req, res) => {
    try {
        const { class_id, academic_year } = req.query;
        let query = 'SELECT * FROM fee_structures WHERE 1=1';
        const params = [];

        if (class_id) {
            params.push(class_id);
            query += ` AND class_id = $${params.length}`;
        }
        if (academic_year) {
            params.push(academic_year);
            query += ` AND academic_year = $${params.length}`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching fee structures:', error);
        res.status(500).json({ message: 'Failed to fetch fee structures' });
    }
};

export const updateFeeStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const { class_id, fee_type, amount, frequency, academic_year } = req.body;
        
        if (!validateFeeData({ student_id: class_id, amount, fee_type, due_date: academic_year })) {
            return res.status(400).json({ message: 'Invalid fee structure data' });
        }

        const result = await pool.query(
            `UPDATE fee_structures 
             SET class_id = $1, fee_type = $2, amount = $3, frequency = $4, academic_year = $5
             WHERE id = $6 RETURNING *`,
            [class_id, fee_type, amount, frequency, academic_year, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Fee structure not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating fee structure:', error);
        res.status(500).json({ message: 'Failed to update fee structure' });
    }
};

export const deleteFeeStructure = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM fee_structures WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Fee structure not found' });
        }

        res.json({ message: 'Fee structure deleted successfully' });
    } catch (error) {
        console.error('Error deleting fee structure:', error);
        res.status(500).json({ message: 'Failed to delete fee structure' });
    }
};

// Fee Challans
export const generateFeeChallan = async (req, res) => {
    try {
        const { student_id, fee_structure_ids, due_date, academic_term } = req.body;
        
        // Get the fee structures
        const structuresQuery = `
            SELECT * FROM fee_structures 
            WHERE id = ANY($1::int[])
        `;
        
        const feeStructures = await pool.query(structuresQuery, [fee_structure_ids]);
        
        if (feeStructures.rows.length === 0) {
            return res.status(404).json({ message: 'Fee structures not found' });
        }
        
        // Calculate total amount
        const totalAmount = feeStructures.rows.reduce((sum, fee) => sum + Number(fee.amount), 0);
        
        // Create the challan
        const result = await pool.query(
            `INSERT INTO fee_challans 
             (student_id, total_amount, due_date, academic_term, status) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [student_id, totalAmount, due_date, academic_term, 'pending']
        );
        
        const challanId = result.rows[0].id;
        
        // Create challan details for each fee structure
        const detailsValues = feeStructures.rows.map((fee, index) => {
            return `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`;
        }).join(', ');
        
        const detailsParams = [challanId];
        feeStructures.rows.forEach(fee => {
            detailsParams.push(fee.id, fee.fee_type, fee.amount);
        });
        
        await pool.query(
            `INSERT INTO fee_challan_details 
             (challan_id, fee_structure_id, fee_type, amount) 
             VALUES ${detailsValues}`,
            detailsParams
        );
        
        // Get the complete challan with details
        const completeResult = await pool.query(
            `SELECT c.*, json_agg(cd.*) as details
             FROM fee_challans c
             JOIN fee_challan_details cd ON c.id = cd.challan_id
             WHERE c.id = $1
             GROUP BY c.id`,
            [challanId]
        );
        
        res.status(201).json(completeResult.rows[0]);
    } catch (error) {
        console.error('Error generating fee challan:', error);
        res.status(500).json({ message: 'Failed to generate fee challan' });
    }
};

export const getFeeChallans = async (req, res) => {
    try {
        const { student_id, status } = req.query;
        let query = `
            SELECT c.*, s.first_name || ' ' || s.last_name as student_name,
                  json_agg(cd.*) as details
            FROM fee_challans c
            JOIN students s ON c.student_id = s.id
            JOIN fee_challan_details cd ON c.id = cd.challan_id
            WHERE 1=1
        `;
        const params = [];
        
        if (student_id) {
            params.push(student_id);
            query += ` AND c.student_id = $${params.length}`;
        }
        
        if (status) {
            params.push(status);
            query += ` AND c.status = $${params.length}`;
        }
        
        query += ' GROUP BY c.id, s.first_name, s.last_name ORDER BY c.due_date';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching fee challans:', error);
        res.status(500).json({ message: 'Failed to fetch fee challans' });
    }
};

// Fee Payments
export const collectFeePayment = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { challan_id, amount_paid, payment_method, payment_date, collected_by, remarks } = req.body;
        
        // Validate the payment
        if (!validatePayment({ fee_id: challan_id, amount_paid, payment_method })) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid payment data' });
        }
        
        // Get the challan
        const challanResult = await client.query(
            'SELECT * FROM fee_challans WHERE id = $1',
            [challan_id]
        );
        
        if (challanResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Fee challan not found' });
        }
        
        const challan = challanResult.rows[0];
        
        // Check if payment is valid
        if (amount_paid <= 0 || amount_paid > challan.total_amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid payment amount' });
        }
        
        // Create the payment
        const paymentResult = await client.query(
            `INSERT INTO fee_payments 
             (challan_id, amount_paid, payment_method, payment_date, collected_by, remarks) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [challan_id, amount_paid, payment_method, payment_date || new Date(), collected_by, remarks]
        );
        
        // Update the challan status
        const newPaidAmount = Number(challan.paid_amount || 0) + Number(amount_paid);
        const remainingAmount = challan.total_amount - newPaidAmount;
        let newStatus = 'partial';
        
        if (remainingAmount <= 0) {
            newStatus = 'paid';
        }
        
        await client.query(
            `UPDATE fee_challans 
             SET paid_amount = $1, status = $2
             WHERE id = $3`,
            [newPaidAmount, newStatus, challan_id]
        );
        
        await client.query('COMMIT');
        res.status(201).json(paymentResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error collecting fee payment:', error);
        res.status(500).json({ message: 'Failed to collect fee payment' });
    } finally {
        client.release();
    }
};

export const getFeePayments = async (req, res) => {
    try {
        const { student_id, start_date, end_date } = req.query;
        let query = `
            SELECT p.*, c.student_id, c.total_amount,
                  s.first_name || ' ' || s.last_name as student_name
            FROM fee_payments p
            JOIN fee_challans c ON p.challan_id = c.id
            JOIN students s ON c.student_id = s.id
            WHERE 1=1
        `;
        const params = [];
        
        if (student_id) {
            params.push(student_id);
            query += ` AND c.student_id = $${params.length}`;
        }
        
        if (start_date) {
            params.push(start_date);
            query += ` AND p.payment_date >= $${params.length}`;
        }
        
        if (end_date) {
            params.push(end_date);
            query += ` AND p.payment_date <= $${params.length}`;
        }
        
        query += ' ORDER BY p.payment_date DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching fee payments:', error);
        res.status(500).json({ message: 'Failed to fetch fee payments' });
    }
};

// Fee Defaulters
export const getFeeDefaulters = async (req, res) => {
    try {
        const { class_id, academic_term } = req.query;
        let query = `
            SELECT c.id as challan_id, c.due_date, c.total_amount, c.paid_amount,
                  (c.total_amount - COALESCE(c.paid_amount, 0)) as pending_amount,
                  s.id as student_id, s.first_name, s.last_name,
                  s.admission_number, cl.name as class_name
            FROM fee_challans c
            JOIN students s ON c.student_id = s.id
            JOIN classes cl ON s.class_id = cl.id
            WHERE c.status != 'paid'
        `;
        const params = [];
        
        if (class_id) {
            params.push(class_id);
            query += ` AND s.class_id = $${params.length}`;
        }
        
        if (academic_term) {
            params.push(academic_term);
            query += ` AND c.academic_term = $${params.length}`;
        }
        
        // Only include challans past their due date
        query += ` AND c.due_date < CURRENT_DATE`;
        
        query += ' ORDER BY c.due_date';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching fee defaulters:', error);
        res.status(500).json({ message: 'Failed to fetch fee defaulters' });
    }
};

// Financial Stats
export const getFinancialStats = async (req, res) => {
    try {
        const { period } = req.query;
        const stats = {};
        
        // Get total fee collection
        const feeQuery = `
            SELECT SUM(amount_paid) as total_collected
            FROM fee_payments
            WHERE payment_date >= CURRENT_DATE - INTERVAL '${period || '1 month'}'
        `;
        
        const feeResult = await pool.query(feeQuery);
        stats.fee_collection = feeResult.rows[0].total_collected || 0;
        
        // Get pending fees
        const pendingQuery = `
            SELECT SUM(total_amount - COALESCE(paid_amount, 0)) as total_pending
            FROM fee_challans
            WHERE status != 'paid' AND due_date < CURRENT_DATE
        `;
        
        const pendingResult = await pool.query(pendingQuery);
        stats.pending_fees = pendingResult.rows[0].total_pending || 0;
        
        // Get total defaulters count
        const defaultersQuery = `
            SELECT COUNT(DISTINCT student_id) as defaulter_count
            FROM fee_challans
            WHERE status != 'paid' AND due_date < CURRENT_DATE
        `;
        
        const defaultersResult = await pool.query(defaultersQuery);
        stats.defaulter_count = defaultersResult.rows[0].defaulter_count || 0;
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching financial stats:', error);
        res.status(500).json({ message: 'Failed to fetch financial stats' });
    }
};

export default {
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
}; 