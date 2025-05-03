const pool = require('../db/config');
const { validateExamSchedule, validateAssessment, validateMarks } = require('../utils/validators');

// Exam Types Controllers
const createExamType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query(
            'INSERT INTO exam_types (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create exam type' });
    }
};

const getExamTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exam_types ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exam types' });
    }
};

// Exam Schedules Controllers
const createExamSchedule = async (req, res) => {
    try {
        const { exam_type_id, class_id, subject_id, exam_date, start_time, end_time, venue } = req.body;
        const created_by = req.user.id;

        if (!validateExamSchedule(req.body)) {
            return res.status(400).json({ error: 'Invalid exam schedule data' });
        }

        const result = await pool.query(
            `INSERT INTO exam_schedules 
            (exam_type_id, class_id, subject_id, exam_date, start_time, end_time, venue, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [exam_type_id, class_id, subject_id, exam_date, start_time, end_time, venue, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create exam schedule' });
    }
};

const getExamSchedules = async (req, res) => {
    try {
        const { class_id, exam_type_id } = req.query;
        let query = `
            SELECT es.*, et.name as exam_type_name, s.name as subject_name
            FROM exam_schedules es
            JOIN exam_types et ON es.exam_type_id = et.id
            JOIN subjects s ON es.subject_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (class_id) {
            params.push(class_id);
            query += ` AND es.class_id = $${params.length}`;
        }
        if (exam_type_id) {
            params.push(exam_type_id);
            query += ` AND es.exam_type_id = $${params.length}`;
        }

        query += ' ORDER BY es.exam_date, es.start_time';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exam schedules' });
    }
};

// Assessments Controllers
const createAssessment = async (req, res) => {
    try {
        const {
            name, description, exam_type_id, class_id,
            subject_id, total_marks, passing_marks
        } = req.body;
        const created_by = req.user.id;

        if (!validateAssessment(req.body)) {
            return res.status(400).json({ error: 'Invalid assessment data' });
        }

        const result = await pool.query(
            `INSERT INTO assessments 
            (name, description, exam_type_id, class_id, subject_id, total_marks, passing_marks, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, description, exam_type_id, class_id, subject_id, total_marks, passing_marks, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create assessment' });
    }
};

// Student Marks Controllers
const enterMarks = async (req, res) => {
    try {
        const { student_id, assessment_id, marks_obtained, remarks } = req.body;
        const entered_by = req.user.id;

        if (!validateMarks(req.body)) {
            return res.status(400).json({ error: 'Invalid marks data' });
        }

        const result = await pool.query(
            `INSERT INTO student_marks 
            (student_id, assessment_id, marks_obtained, remarks, entered_by) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [student_id, assessment_id, marks_obtained, remarks, entered_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to enter marks' });
    }
};

const getStudentMarks = async (req, res) => {
    try {
        const { student_id, assessment_id } = req.query;
        let query = `
            SELECT sm.*, a.name as assessment_name, s.name as subject_name,
                   et.name as exam_type_name
            FROM student_marks sm
            JOIN assessments a ON sm.assessment_id = a.id
            JOIN subjects s ON a.subject_id = s.id
            JOIN exam_types et ON a.exam_type_id = et.id
            WHERE 1=1
        `;
        const params = [];

        if (student_id) {
            params.push(student_id);
            query += ` AND sm.student_id = $${params.length}`;
        }
        if (assessment_id) {
            params.push(assessment_id);
            query += ` AND sm.assessment_id = $${params.length}`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch student marks' });
    }
};

// Report Card Controllers
const generateReportCard = async (req, res) => {
    try {
        const { student_id, class_id, exam_type_id } = req.body;
        const generated_by = req.user.id;

        // Calculate total marks and percentage
        const marksResult = await pool.query(
            `SELECT SUM(sm.marks_obtained) as total_obtained, 
                    SUM(a.total_marks) as total_possible
             FROM student_marks sm
             JOIN assessments a ON sm.assessment_id = a.id
             WHERE sm.student_id = $1 
             AND a.exam_type_id = $2
             AND a.class_id = $3`,
            [student_id, exam_type_id, class_id]
        );

        const { total_obtained, total_possible } = marksResult.rows[0];
        const percentage = (total_obtained / total_possible) * 100;
        const grade = calculateGrade(percentage);

        const result = await pool.query(
            `INSERT INTO report_cards 
            (student_id, class_id, exam_type_id, total_marks, percentage, grade, generated_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [student_id, class_id, exam_type_id, total_obtained, percentage, grade, generated_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report card' });
    }
};

const getReportCard = async (req, res) => {
    try {
        const { student_id, exam_type_id } = req.query;
        const result = await pool.query(
            `SELECT rc.*, et.name as exam_type_name,
                    s.first_name || ' ' || s.last_name as student_name,
                    c.name as class_name
             FROM report_cards rc
             JOIN exam_types et ON rc.exam_type_id = et.id
             JOIN students s ON rc.student_id = s.id
             JOIN classes c ON rc.class_id = c.id
             WHERE rc.student_id = $1 AND rc.exam_type_id = $2`,
            [student_id, exam_type_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch report card' });
    }
};

// Helper function to calculate grade based on percentage
const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
};

module.exports = {
    createExamType,
    getExamTypes,
    createExamSchedule,
    getExamSchedules,
    createAssessment,
    enterMarks,
    getStudentMarks,
    generateReportCard,
    getReportCard
}; 