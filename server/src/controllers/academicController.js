import { pool } from '../db/connection.js';
import { uploadFile } from '../utils/fileUpload.js';

// Class Management Controllers
export const createClass = async (req, res) => {
    const { name, academic_year, sections } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // Create class
        const classResult = await client.query(
            'INSERT INTO classes (name, academic_year) VALUES ($1, $2) RETURNING id',
            [name, academic_year]
        );
        
        // Create sections
        if (sections && sections.length > 0) {
            const classId = classResult.rows[0].id;
            for (const section of sections) {
                await client.query(
                    'INSERT INTO sections (class_id, name) VALUES ($1, $2)',
                    [classId, section]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Class created successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

export const getClasses = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, array_agg(s.name) as sections
            FROM classes c
            LEFT JOIN sections s ON c.id = s.class_id
            GROUP BY c.id
            ORDER BY c.name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const assignTeacher = async (req, res) => {
    const { class_id, subject_id, teacher_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO class_subjects (class_id, subject_id, teacher_id) VALUES ($1, $2, $3)',
            [class_id, subject_id, teacher_id]
        );
        res.status(201).json({ message: 'Teacher assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Study Materials Controllers
export const uploadStudyMaterial = async (req, res) => {
    try {
        const { title, description, subject_id, class_id } = req.body;
        const file = req.file;
        
        const filePath = await uploadFile(file);
        
        await pool.query(
            'INSERT INTO study_materials (title, description, file_path, subject_id, teacher_id, class_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [title, description, filePath, subject_id, req.user.id, class_id]
        );
        
        res.status(201).json({ message: 'Study material uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Timetable Management Controllers
export const createTimetableSlot = async (req, res) => {
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number } = req.body;
    try {
        await pool.query(
            'INSERT INTO timetable_slots (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number]
        );
        res.status(201).json({ message: 'Timetable slot created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClassTimetable = async (req, res) => {
    const { class_id } = req.params;
    try {
        const result = await pool.query(`
            SELECT ts.*, s.name as subject_name, u.name as teacher_name
            FROM timetable_slots ts
            JOIN subjects s ON ts.subject_id = s.id
            JOIN users u ON ts.teacher_id = u.id
            WHERE ts.class_id = $1
            ORDER BY ts.day_of_week, ts.start_time
        `, [class_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const requestScheduleChange = async (req, res) => {
    const { timetable_slot_id, requested_date, requested_start_time, requested_end_time, reason } = req.body;
    try {
        await pool.query(
            'INSERT INTO schedule_change_requests (timetable_slot_id, teacher_id, requested_date, requested_start_time, requested_end_time, reason) VALUES ($1, $2, $3, $4, $5, $6)',
            [timetable_slot_id, req.user.id, requested_date, requested_start_time, requested_end_time, reason]
        );
        res.status(201).json({ message: 'Schedule change requested successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markSubstitution = async (req, res) => {
    const { timetable_slot_id, substitute_teacher_id, date, reason } = req.body;
    try {
        await pool.query(
            'INSERT INTO substitutions (timetable_slot_id, original_teacher_id, substitute_teacher_id, date, reason) VALUES ($1, $2, $3, $4, $5)',
            [timetable_slot_id, req.user.id, substitute_teacher_id, date, reason]
        );
        res.status(201).json({ message: 'Substitution marked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// New controller functions
export const updateClass = async (req, res) => {
    const { id } = req.params;
    const { name, academic_year, sections } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // Update class
        await client.query(
            'UPDATE classes SET name = $1, academic_year = $2 WHERE id = $3',
            [name, academic_year, id]
        );
        
        // Update sections
        await client.query('DELETE FROM sections WHERE class_id = $1', [id]);
        
        if (sections && sections.length > 0) {
            for (const section of sections) {
                await client.query(
                    'INSERT INTO sections (class_id, name) VALUES ($1, $2)',
                    [id, section]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Class updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

export const deleteClass = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM classes WHERE id = $1', [id]);
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Class Activities Controllers
export const createActivity = async (req, res) => {
    const { class_id, title, description, due_date, type } = req.body;
    try {
        await pool.query(
            'INSERT INTO class_activities (class_id, teacher_id, title, description, due_date, type) VALUES ($1, $2, $3, $4, $5, $6)',
            [class_id, req.user.id, title, description, due_date, type]
        );
        res.status(201).json({ message: 'Activity created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClassActivities = async (req, res) => {
    const { class_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT ca.*, u.name as teacher_name 
             FROM class_activities ca 
             JOIN users u ON ca.teacher_id = u.id 
             WHERE ca.class_id = $1 
             ORDER BY ca.due_date`,
            [class_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Announcements Controllers
export const createAnnouncement = async (req, res) => {
    const { class_id, title, content } = req.body;
    try {
        await pool.query(
            'INSERT INTO class_announcements (class_id, teacher_id, title, content) VALUES ($1, $2, $3, $4)',
            [class_id, req.user.id, title, content]
        );
        res.status(201).json({ message: 'Announcement created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAnnouncements = async (req, res) => {
    const { class_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT ca.*, u.name as teacher_name 
             FROM class_announcements ca 
             JOIN users u ON ca.teacher_id = u.id 
             WHERE ca.class_id = $1 
             ORDER BY ca.created_at DESC`,
            [class_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Notifications Controller
export const getScheduleChanges = async (req, res) => {
    const { class_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT sc.*, ts.start_time, ts.end_time, 
                    s.name as subject_name, u.name as teacher_name,
                    sub.name as substitute_teacher_name
             FROM schedule_change_requests sc
             JOIN timetable_slots ts ON sc.timetable_slot_id = ts.id
             JOIN subjects s ON ts.subject_id = s.id
             JOIN users u ON ts.teacher_id = u.id
             LEFT JOIN users sub ON sc.substitute_teacher_id = sub.id
             WHERE ts.class_id = $1 AND sc.status = 'approved'
             ORDER BY sc.requested_date`,
            [class_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 