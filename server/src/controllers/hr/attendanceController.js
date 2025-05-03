import { pool } from '../../db/connection.js';
import { handleError } from '../../utils/errorHandler.js';

const attendanceController = {
    // Get all attendance records within a date range
    getAllAttendance: async (req, res) => {
        try {
            const { startDate, endDate, staffId } = req.query;
            
            let query = `
                SELECT sa.*, 
                       CONCAT(s.first_name, ' ', s.last_name) as staff_name,
                       s.employee_id
                FROM staff_attendance sa
                JOIN staff s ON sa.staff_id = s.id
                WHERE sa.date BETWEEN $1 AND $2
            `;
            
            const queryParams = [startDate, endDate];
            
            if (staffId) {
                query += ` AND sa.staff_id = $3`;
                queryParams.push(staffId);
            }
            
            query += ` ORDER BY sa.date DESC, sa.check_in ASC`;
            
            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get staff member's attendance records
    getStaffAttendance: async (req, res) => {
        try {
            const { staffId } = req.params;
            const { startDate, endDate } = req.query;

            const query = `
                SELECT sa.*, 
                       CONCAT(s.first_name, ' ', s.last_name) as staff_name,
                       s.employee_id
                FROM staff_attendance sa
                JOIN staff s ON sa.staff_id = s.id
                WHERE sa.staff_id = $1
                  AND sa.date BETWEEN $2 AND $3
                ORDER BY sa.date DESC
            `;

            const result = await pool.query(query, [staffId, startDate, endDate]);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Create a new attendance record
    createAttendance: async (req, res) => {
        try {
            const { 
                staff_id, date, check_in, check_out, 
                status, reason
            } = req.body;

            const query = `
                INSERT INTO staff_attendance (
                    staff_id, date, check_in, check_out, 
                    status, reason
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const values = [
                staff_id, date, check_in, check_out, 
                status, reason
            ];

            const result = await pool.query(query, values);
            
            // Get staff details for the response
            const staffQuery = `
                SELECT CONCAT(first_name, ' ', last_name) as staff_name,
                       employee_id
                FROM staff WHERE id = $1
            `;
            const staffResult = await pool.query(staffQuery, [staff_id]);
            
            const attendanceRecord = {
                ...result.rows[0],
                staff_name: staffResult.rows[0]?.staff_name,
                employee_id: staffResult.rows[0]?.employee_id
            };
            
            res.status(201).json(attendanceRecord);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Update an attendance record
    updateAttendance: async (req, res) => {
        try {
            const { attendanceId } = req.params;
            const { 
                staff_id, date, check_in, check_out, 
                status, reason
            } = req.body;

            const query = `
                UPDATE staff_attendance
                SET staff_id = $1,
                    date = $2,
                    check_in = $3,
                    check_out = $4,
                    status = $5,
                    reason = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING *
            `;

            const values = [
                staff_id, date, check_in, check_out, 
                status, reason, attendanceId
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Attendance record not found' });
            }
            
            // Get staff details for the response
            const staffQuery = `
                SELECT CONCAT(first_name, ' ', last_name) as staff_name,
                       employee_id
                FROM staff WHERE id = $1
            `;
            const staffResult = await pool.query(staffQuery, [staff_id]);
            
            const attendanceRecord = {
                ...result.rows[0],
                staff_name: staffResult.rows[0]?.staff_name,
                employee_id: staffResult.rows[0]?.employee_id
            };
            
            res.json(attendanceRecord);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Delete an attendance record
    deleteAttendance: async (req, res) => {
        try {
            const { attendanceId } = req.params;

            const result = await pool.query(
                'DELETE FROM staff_attendance WHERE id = $1 RETURNING *',
                [attendanceId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Attendance record not found' });
            }

            res.json({ message: 'Attendance record deleted successfully' });
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get attendance summary statistics
    getAttendanceSummary: async (req, res) => {
        try {
            const { startDate, endDate, staffId } = req.query;
            
            let query = `
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'present') as present_count,
                    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
                    COUNT(*) FILTER (WHERE status = 'leave') as leave_count,
                    COUNT(*) FILTER (
                        WHERE status = 'present' 
                        AND EXTRACT(HOUR FROM check_in) * 60 + EXTRACT(MINUTE FROM check_in) > 9 * 60
                    ) as late_count
                FROM staff_attendance
                WHERE date BETWEEN $1 AND $2
            `;
            
            const queryParams = [startDate, endDate];
            
            if (staffId) {
                query += ` AND staff_id = $3`;
                queryParams.push(staffId);
            }
            
            const result = await pool.query(query, queryParams);
            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Bulk mark attendance
    bulkMarkAttendance: async (req, res) => {
        try {
            const { date, records } = req.body;
            
            // Begin a transaction
            await pool.query('BEGIN');
            
            const results = [];
            
            for (const record of records) {
                const { 
                    staff_id, status, check_in, check_out, reason
                } = record;
                
                const query = `
                    INSERT INTO staff_attendance (
                        staff_id, date, check_in, check_out, 
                        status, reason
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (staff_id, date) 
                    DO UPDATE SET
                        check_in = EXCLUDED.check_in,
                        check_out = EXCLUDED.check_out,
                        status = EXCLUDED.status,
                        reason = EXCLUDED.reason,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                `;
                
                const values = [
                    staff_id, date, check_in, check_out, 
                    status, reason
                ];
                
                const result = await pool.query(query, values);
                results.push(result.rows[0]);
            }
            
            // Commit the transaction
            await pool.query('COMMIT');
            
            res.status(201).json({
                message: `Successfully processed ${results.length} attendance records`,
                records: results
            });
        } catch (error) {
            // Rollback the transaction in case of error
            await pool.query('ROLLBACK');
            handleError(res, error);
        }
    },

    // Get working hours summary
    getWorkingHoursSummary: async (req, res) => {
        try {
            const { startDate, endDate, staffId } = req.query;
            
            let query = `
                SELECT 
                    staff_id,
                    CONCAT(s.first_name, ' ', s.last_name) as staff_name,
                    SUM(
                        EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
                    ) as total_hours
                FROM staff_attendance sa
                JOIN staff s ON sa.staff_id = s.id
                WHERE date BETWEEN $1 AND $2
                AND status = 'present'
                AND check_in IS NOT NULL 
                AND check_out IS NOT NULL
            `;
            
            const queryParams = [startDate, endDate];
            
            if (staffId) {
                query += ` AND staff_id = $3`;
                queryParams.push(staffId);
            }
            
            query += ` GROUP BY staff_id, s.first_name, s.last_name
                       ORDER BY total_hours DESC`;
            
            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    }
};

export default attendanceController; 