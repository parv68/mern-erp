import express from 'express';
import { pool } from '../db/connection.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get attendance for a class
router.get('/class/:classId', verifyToken, async (req, res) => {
    try {
        const { classId } = req.params;
        const { date } = req.query;
        
        const query = `
            SELECT a.*, s.first_name, s.last_name 
            FROM attendance a 
            JOIN students s ON a.student_id = s.id 
            WHERE a.class_id = $1 AND DATE(a.date) = $2
        `;
        
        const result = await pool.query(query, [classId, date]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Error fetching attendance' });
    }
});

// Mark attendance
router.post('/mark', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
    try {
        const { classId, date, attendanceData } = req.body;
        
        // Start a transaction
        await pool.query('BEGIN');
        
        for (const record of attendanceData) {
            const { studentId, status } = record;
            await pool.query(
                `INSERT INTO attendance (class_id, student_id, date, status) 
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (class_id, student_id, date) 
                 DO UPDATE SET status = $4`,
                [classId, studentId, date, status]
            );
        }
        
        await pool.query('COMMIT');
        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Error marking attendance' });
    }
});

// Get student's attendance history
router.get('/student/:studentId', verifyToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate } = req.query;
        
        const query = `
            SELECT a.*, c.name as class_name 
            FROM attendance a 
            JOIN classes c ON a.class_id = c.id 
            WHERE a.student_id = $1 
            AND a.date BETWEEN $2 AND $3
            ORDER BY a.date DESC
        `;
        
        const result = await pool.query(query, [studentId, startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({ message: 'Error fetching student attendance' });
    }
});

// Get attendance statistics
router.get('/stats/:classId', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
    try {
        const { classId } = req.params;
        const { month, year } = req.query;
        
        const query = `
            SELECT 
                s.id as student_id,
                s.first_name,
                s.last_name,
                COUNT(*) as total_days,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id 
            AND EXTRACT(MONTH FROM a.date) = $2
            AND EXTRACT(YEAR FROM a.date) = $3
            WHERE s.class_id = $1
            GROUP BY s.id, s.first_name, s.last_name
        `;
        
        const result = await pool.query(query, [classId, month, year]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching attendance statistics:', error);
        res.status(500).json({ message: 'Error fetching attendance statistics' });
    }
});

export default router; 