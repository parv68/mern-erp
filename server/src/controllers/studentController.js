import { pool } from '../db/connection.js';
import { generateAdmissionNumber } from '../utils/studentUtils.js';

// Admission & Records Controllers
export const admitStudent = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const {
            first_name,
            last_name,
            date_of_birth,
            gender,
            class_id,
            section,
            parent_name,
            parent_phone,
            parent_email,
            address,
            blood_group,
            previous_school
        } = req.body;

        const admission_number = await generateAdmissionNumber();
        const admission_date = new Date().toISOString().split('T')[0];

        const result = await client.query(
            `INSERT INTO students (
                admission_number, first_name, last_name, date_of_birth, gender,
                admission_date, class_id, section, parent_name, parent_phone,
                parent_email, address, blood_group, previous_school
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id`,
            [
                admission_number, first_name, last_name, date_of_birth, gender,
                admission_date, class_id, section, parent_name, parent_phone,
                parent_email, address, blood_group, previous_school
            ]
        );

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Student admitted successfully',
            student_id: result.rows[0].id,
            admission_number
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Get all students
export const getAllStudents = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, c.name as class_name 
             FROM students s 
             LEFT JOIN classes c ON s.class_id = c.id 
             ORDER BY s.first_name, s.last_name`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Error fetching students' });
    }
};

// Get student by ID
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT s.*, c.name as class_name,
                    p.name as parent_name, p.contact as parent_contact,
                    p.email as parent_email
             FROM students s 
             LEFT JOIN classes c ON s.class_id = c.id
             LEFT JOIN parents p ON s.parent_id = p.id
             WHERE s.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: 'Error fetching student details' });
    }
};

// Update student
export const updateStudent = async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE students 
             SET ${Object.keys(updateFields).map((key, i) => `${key} = $${i + 1}`).join(', ')},
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $${Object.keys(updateFields).length + 1}
             RETURNING *`,
            [...Object.values(updateFields), id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete student
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM students WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Error deleting student' });
    }
};

// Get students by class
export const getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const result = await pool.query(
            `SELECT s.*, c.name as class_name 
             FROM students s 
             JOIN classes c ON s.class_id = c.id 
             WHERE s.class_id = $1 
             ORDER BY s.first_name, s.last_name`,
            [classId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students by class:', error);
        res.status(500).json({ message: 'Error fetching students by class' });
    }
};

// Get student academic performance
export const getStudentPerformance = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT e.*, s.name as subject_name, ex.name as exam_name
             FROM exam_results e
             JOIN subjects s ON e.subject_id = s.id
             JOIN exams ex ON e.exam_id = ex.id
             WHERE e.student_id = $1
             ORDER BY e.exam_date DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching student performance:', error);
        res.status(500).json({ message: 'Error fetching student performance' });
    }
};

// Attendance Management Controllers
export const markAttendance = async (req, res) => {
    const { class_id, date, attendance } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Delete existing attendance records for the class and date
        await client.query(
            'DELETE FROM student_attendance WHERE class_id = $1 AND date = $2',
            [class_id, date]
        );
        
        // Insert new attendance records
        for (const record of attendance) {
            await client.query(
                `INSERT INTO student_attendance (
                    student_id, class_id, date, status, marked_by
                ) VALUES ($1, $2, $3, $4, $5)`,
                [record.student_id, class_id, date, record.status, req.user.id]
            );
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

export const getAttendance = async (req, res) => {
    const { class_id, start_date, end_date } = req.query;
    try {
        const result = await pool.query(
            `SELECT sa.*, s.first_name, s.last_name, s.admission_number
             FROM student_attendance sa
             JOIN students s ON sa.student_id = s.id
             WHERE sa.class_id = $1 
             AND sa.date BETWEEN $2 AND $3
             ORDER BY sa.date, s.first_name, s.last_name`,
            [class_id, start_date, end_date]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStudentAttendance = async (req, res) => {
    const { student_id, start_date, end_date } = req.query;
    try {
        const result = await pool.query(
            `SELECT sa.*, u.name as marked_by_name
             FROM student_attendance sa
             LEFT JOIN users u ON sa.marked_by = u.id
             WHERE sa.student_id = $1 
             AND sa.date BETWEEN $2 AND $3
             ORDER BY sa.date`,
            [student_id, start_date, end_date]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Leave Management
export const submitLeaveApplication = async (req, res) => {
    const { student_id, start_date, end_date, reason } = req.body;
    try {
        await pool.query(
            `INSERT INTO leave_applications (
                student_id, start_date, end_date, reason, applied_by
            ) VALUES ($1, $2, $3, $4, $5)`,
            [student_id, start_date, end_date, reason, req.user.id]
        );
        res.status(201).json({ message: 'Leave application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            `UPDATE leave_applications 
             SET status = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 RETURNING *`,
            [status, req.user.id, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Leave application not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLeaveApplications = async (req, res) => {
    const { student_id, status } = req.query;
    try {
        let query = `
            SELECT la.*, s.first_name, s.last_name,
                   u1.name as applied_by_name,
                   u2.name as approved_by_name
            FROM leave_applications la
            JOIN students s ON la.student_id = s.id
            LEFT JOIN users u1 ON la.applied_by = u1.id
            LEFT JOIN users u2 ON la.approved_by = u2.id
            WHERE 1=1
        `;
        const params = [];
        
        if (student_id) {
            params.push(student_id);
            query += ` AND la.student_id = $${params.length}`;
        }
        
        if (status) {
            params.push(status);
            query += ` AND la.status = $${params.length}`;
        }
        
        query += ' ORDER BY la.created_at DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 