import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all subjects
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM subjects ORDER BY name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get subject by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT s.*, 
                    (SELECT COUNT(*) FROM subject_teachers WHERE subject_id = s.id) as teacher_count
             FROM subjects s
             WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new subject
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, code, credits, description } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({ error: 'Subject name and code are required' });
        }

        const result = await pool.query(
            `INSERT INTO subjects (name, code, credits, description)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, code, credits, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Check for duplicate constraint
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Subject with this code already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Update subject
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, credits, description } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({ error: 'Subject name and code are required' });
        }

        const result = await pool.query(
            `UPDATE subjects 
             SET name = $1, code = $2, credits = $3, description = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5 RETURNING *`,
            [name, code, credits, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        // Check for duplicate constraint
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Subject with this code already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete subject
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if subject is being used in classes or exams
        const checkResult = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM timetable WHERE subject_id = $1) as timetable_count,
                (SELECT COUNT(*) FROM exams WHERE subject_id = $1) as exam_count
            `,
            [id]
        );

        const { timetable_count, exam_count } = checkResult.rows[0];
        
        if (parseInt(timetable_count) > 0 || parseInt(exam_count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete subject as it is being used in timetable or exams'
            });
        }

        // Delete subject
        const result = await pool.query(
            `DELETE FROM subjects WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Allocate teacher to subject
router.post('/allocate', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { subject_id, teacher_id, class_id } = req.body;

        // Validate required fields
        if (!subject_id || !teacher_id || !class_id) {
            return res.status(400).json({ 
                error: 'Subject ID, teacher ID and class ID are required' 
            });
        }

        const result = await pool.query(
            `INSERT INTO subject_teachers (subject_id, teacher_id, class_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [subject_id, teacher_id, class_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Check for duplicate constraint
        if (error.code === '23505') {
            return res.status(400).json({ 
                error: 'This teacher is already allocated to this subject for this class' 
            });
        }
        res.status(500).json({ error: error.message });
    }
});

// Deallocate teacher from subject
router.delete('/allocate/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM subject_teachers WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject teacher allocation not found' });
        }

        res.json({ message: 'Teacher deallocated from subject successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 