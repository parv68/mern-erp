import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all classes
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, 
                    u.name as teacher_name,
                    (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count,
                    (SELECT COUNT(*) FROM sections WHERE class_id = c.id) as section_count
             FROM classes c
             LEFT JOIN users u ON c.teacher_id = u.id
             ORDER BY c.name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get class by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const classResult = await pool.query(
            `SELECT c.*, u.name as teacher_name
             FROM classes c
             LEFT JOIN users u ON c.teacher_id = u.id
             WHERE c.id = $1`,
            [id]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Get sections for this class
        const sectionsResult = await pool.query(
            `SELECT * FROM sections WHERE class_id = $1`,
            [id]
        );

        // Return class with its sections
        const classData = classResult.rows[0];
        classData.sections = sectionsResult.rows;

        res.json(classData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new class
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, teacher_id, description } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Class name is required' });
        }

        const result = await pool.query(
            `INSERT INTO classes (name, teacher_id, description)
             VALUES ($1, $2, $3) RETURNING *`,
            [name, teacher_id, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update class
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, teacher_id, description } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Class name is required' });
        }

        const result = await pool.query(
            `UPDATE classes 
             SET name = $1, teacher_id = $2, description = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 RETURNING *`,
            [name, teacher_id, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete class
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class has students
        const studentsCheck = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE class_id = $1`,
            [id]
        );

        if (parseInt(studentsCheck.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete class with assigned students'
            });
        }

        // Start transaction
        await pool.query('BEGIN');

        // Delete sections first
        await pool.query(
            `DELETE FROM sections WHERE class_id = $1`,
            [id]
        );

        // Delete class
        const result = await pool.query(
            `DELETE FROM classes WHERE id = $1 RETURNING *`,
            [id]
        );

        await pool.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// Create section
router.post('/:class_id/sections', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { class_id } = req.params;
        const { name, capacity } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Section name is required' });
        }

        // Check if class exists
        const classCheck = await pool.query(
            `SELECT id FROM classes WHERE id = $1`,
            [class_id]
        );

        if (classCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        const result = await pool.query(
            `INSERT INTO sections (class_id, name, capacity)
             VALUES ($1, $2, $3) RETURNING *`,
            [class_id, name, capacity]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update section
router.put('/sections/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, capacity } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Section name is required' });
        }

        const result = await pool.query(
            `UPDATE sections 
             SET name = $1, capacity = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 RETURNING *`,
            [name, capacity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Section not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete section
router.delete('/sections/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if section has students
        const studentsCheck = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE section_id = $1`,
            [id]
        );

        if (parseInt(studentsCheck.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete section with assigned students'
            });
        }

        const result = await pool.query(
            `DELETE FROM sections WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Section not found' });
        }

        res.json({ message: 'Section deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 