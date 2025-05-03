import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { upload } from '../middleware/fileUpload.js';
import { pool } from '../db/connection.js';

const router = express.Router();

// Class Management Routes
router.post('/classes', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, section, teacher_id, description } = req.body;
        
        const result = await pool.query(
            `INSERT INTO classes (name, section, teacher_id, description)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, section, teacher_id, description]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/classes', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, u.name as teacher_name
             FROM classes c
             LEFT JOIN users u ON c.teacher_id = u.id
             ORDER BY c.name, c.section`
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/classes/assign-teacher', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { class_id, teacher_id } = req.body;
        
        const result = await pool.query(
            `UPDATE classes SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [teacher_id, class_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Study Materials Routes
router.post(
    '/study-materials',
    verifyToken,
    checkRole(['teacher', 'admin']),
    upload.single('file'),
    async (req, res) => {
        try {
            const { class_id, subject_id, title, description } = req.body;
            const file = req.file;
            
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            
            const result = await pool.query(
                `INSERT INTO study_materials 
                 (class_id, subject_id, title, description, file_path, file_name, uploaded_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    class_id, 
                    subject_id, 
                    title, 
                    description, 
                    file.path, 
                    file.originalname, 
                    req.user.id
                ]
            );
            
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.get('/study-materials/:class_id', verifyToken, async (req, res) => {
    try {
        const { class_id } = req.params;
        const { subject_id } = req.query;
        
        let query = `
            SELECT sm.*, s.name as subject_name, u.name as uploaded_by_name
            FROM study_materials sm
            LEFT JOIN subjects s ON sm.subject_id = s.id
            LEFT JOIN users u ON sm.uploaded_by = u.id
            WHERE sm.class_id = $1
        `;
        
        const params = [class_id];
        
        if (subject_id) {
            query += ` AND sm.subject_id = $2`;
            params.push(subject_id);
        }
        
        query += ` ORDER BY sm.created_at DESC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Timetable Management Routes
router.post('/timetable', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const {
            class_id,
            subject_id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            room_number
        } = req.body;
        
        const result = await pool.query(
            `INSERT INTO timetable 
             (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/timetable/:class_id', verifyToken, async (req, res) => {
    try {
        const { class_id } = req.params;
        
        const result = await pool.query(
            `SELECT t.*, s.name as subject_name, u.name as teacher_name
             FROM timetable t
             LEFT JOIN subjects s ON t.subject_id = s.id
             LEFT JOIN users u ON t.teacher_id = u.id
             WHERE t.class_id = $1
             ORDER BY t.day_of_week, t.start_time`,
            [class_id]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/timetable/schedule-change', verifyToken, checkRole(['teacher']), async (req, res) => {
    try {
        const {
            timetable_id,
            new_date,
            new_start_time,
            new_end_time,
            reason
        } = req.body;
        
        const result = await pool.query(
            `INSERT INTO schedule_changes
             (timetable_id, original_date, new_date, new_start_time, new_end_time, reason, requested_by)
             VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6) RETURNING *`,
            [timetable_id, new_date, new_start_time, new_end_time, reason, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/timetable/substitution', verifyToken, checkRole(['admin', 'teacher']), async (req, res) => {
    try {
        const {
            timetable_id,
            substitute_teacher_id,
            date,
            reason
        } = req.body;
        
        const result = await pool.query(
            `INSERT INTO substitutions
             (timetable_id, substitute_teacher_id, date, reason, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [timetable_id, substitute_teacher_id, date, reason, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 