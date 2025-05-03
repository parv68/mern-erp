import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all exams
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, 
                    c.name as class_name,
                    s.name as subject_name
             FROM exams e
             LEFT JOIN classes c ON e.class_id = c.id
             LEFT JOIN subjects s ON e.subject_id = s.id
             ORDER BY e.exam_date DESC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new exam
router.post('/', verifyToken, checkRole(['admin', 'teacher']), async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            name,
            class_id,
            subject_id,
            exam_date,
            start_time,
            end_time,
            total_marks,
            passing_marks,
            description
        } = req.body;

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO exams (
                name, class_id, subject_id, exam_date,
                start_time, end_time, total_marks,
                passing_marks, description, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id`,
            [
                name, class_id, subject_id, exam_date,
                start_time, end_time, total_marks,
                passing_marks, description, req.user.id
            ]
        );

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Exam created successfully',
            exam_id: result.rows[0].id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get exam by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT e.*, 
                    c.name as class_name,
                    s.name as subject_name,
                    u.name as created_by_name
             FROM exams e
             LEFT JOIN classes c ON e.class_id = c.id
             LEFT JOIN subjects s ON e.subject_id = s.id
             LEFT JOIN users u ON e.created_by = u.id
             WHERE e.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update exam
router.put('/:id', verifyToken, checkRole(['admin', 'teacher']), async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;
        
        const result = await pool.query(
            `UPDATE exams 
             SET ${Object.keys(updateFields).map((key, i) => `${key} = $${i + 1}`).join(', ')},
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $${Object.keys(updateFields).length + 1}
             RETURNING *`,
            [...Object.values(updateFields), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete exam
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Delete exam results first
        await client.query('DELETE FROM exam_results WHERE exam_id = $1', [id]);

        // Delete the exam
        const result = await client.query(
            'DELETE FROM exams WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            throw new Error('Exam not found');
        }

        await client.query('COMMIT');
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Add exam results
router.post('/:id/results', verifyToken, checkRole(['admin', 'teacher']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { results } = req.body;

        await client.query('BEGIN');

        for (const result of results) {
            await client.query(
                `INSERT INTO exam_results (
                    exam_id, student_id, marks_obtained,
                    remarks, entered_by
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (exam_id, student_id) 
                DO UPDATE SET 
                    marks_obtained = EXCLUDED.marks_obtained,
                    remarks = EXCLUDED.remarks,
                    updated_at = CURRENT_TIMESTAMP`,
                [id, result.student_id, result.marks_obtained, result.remarks, req.user.id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Exam results added successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get exam results
router.get('/:id/results', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT er.*, 
                    s.first_name, s.last_name,
                    s.admission_number,
                    u.name as entered_by_name
             FROM exam_results er
             JOIN students s ON er.student_id = s.id
             LEFT JOIN users u ON er.entered_by = u.id
             WHERE er.exam_id = $1
             ORDER BY er.marks_obtained DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 