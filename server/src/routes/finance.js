import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get fee structure
router.get('/fee-structure', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT fs.*, c.name as class_name
             FROM fee_structure fs
             JOIN classes c ON fs.class_id = c.id
             ORDER BY c.name, fs.fee_type`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create/Update fee structure
router.post('/fee-structure', verifyToken, checkRole(['admin']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { class_id, fee_type, amount, frequency } = req.body;

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO fee_structure (
                class_id, fee_type, amount, frequency
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (class_id, fee_type) 
            DO UPDATE SET 
                amount = EXCLUDED.amount,
                frequency = EXCLUDED.frequency,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [class_id, fee_type, amount, frequency]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Generate fee for students
router.post('/generate-fees', verifyToken, checkRole(['admin']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { class_id, fee_type, due_date, description } = req.body;

        await client.query('BEGIN');

        // Get students in the class
        const students = await client.query(
            'SELECT id FROM students WHERE class_id = $1',
            [class_id]
        );

        // Get fee amount from structure
        const feeStructure = await client.query(
            'SELECT amount FROM fee_structure WHERE class_id = $1 AND fee_type = $2',
            [class_id, fee_type]
        );

        if (feeStructure.rows.length === 0) {
            throw new Error('Fee structure not found');
        }

        const amount = feeStructure.rows[0].amount;

        // Generate fees for each student
        for (const student of students.rows) {
            await client.query(
                `INSERT INTO fees (
                    student_id, fee_type, amount,
                    due_date, description, status
                ) VALUES ($1, $2, $3, $4, $5, 'pending')`,
                [student.id, fee_type, amount, due_date, description]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Fees generated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Record fee payment
router.post('/payments', verifyToken, checkRole(['admin']), async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            student_id,
            fee_id,
            amount_paid,
            payment_method,
            transaction_id,
            remarks
        } = req.body;

        await client.query('BEGIN');

        // Create payment record
        await client.query(
            `INSERT INTO fee_payments (
                student_id, fee_id, amount_paid,
                payment_method, transaction_id,
                remarks, received_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                student_id, fee_id, amount_paid,
                payment_method, transaction_id,
                remarks, req.user.id
            ]
        );

        // Update fee status
        await client.query(
            `UPDATE fees 
             SET status = CASE 
                WHEN total_paid + $1 >= amount THEN 'paid'
                ELSE 'partial'
             END,
             total_paid = total_paid + $1,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [amount_paid, fee_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Payment recorded successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get student's fee details
router.get('/student/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT f.*, 
                    COALESCE(
                        (SELECT SUM(amount_paid) 
                         FROM fee_payments 
                         WHERE fee_id = f.id),
                        0
                    ) as paid_amount
             FROM fees f
             WHERE f.student_id = $1
             ORDER BY f.due_date DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get payment history
router.get('/payments/:student_id', verifyToken, async (req, res) => {
    try {
        const { student_id } = req.params;
        const result = await pool.query(
            `SELECT fp.*, 
                    f.fee_type,
                    u.name as received_by_name
             FROM fee_payments fp
             JOIN fees f ON fp.fee_id = f.id
             LEFT JOIN users u ON fp.received_by = u.id
             WHERE fp.student_id = $1
             ORDER BY fp.payment_date DESC`,
            [student_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get fee defaulters
router.get('/defaulters', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.id, s.first_name, s.last_name,
                    s.admission_number, c.name as class_name,
                    f.fee_type, f.amount, f.due_date,
                    COALESCE(f.total_paid, 0) as paid_amount,
                    (f.amount - COALESCE(f.total_paid, 0)) as pending_amount
             FROM fees f
             JOIN students s ON f.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE f.status IN ('pending', 'partial')
             AND f.due_date < CURRENT_DATE
             ORDER BY f.due_date`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 