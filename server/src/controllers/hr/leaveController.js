import { pool } from '../../db/connection.js';
import { handleError } from '../../utils/errorHandler.js';

const leaveController = {
    // Create leave type
    createLeaveType: async (req, res) => {
        try {
            const { name, days_allowed, is_paid, description } = req.body;

            const query = `
                INSERT INTO leave_types (name, days_allowed, is_paid, description)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const result = await pool.query(query, [name, days_allowed, is_paid, description]);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get all leave types
    getLeaveTypes: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM leave_types ORDER BY name');
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Apply for leave
    applyLeave: async (req, res) => {
        try {
            const { staff_id, leave_type_id, start_date, end_date, reason } = req.body;

            // Check remaining leave balance
            const leaveType = await pool.query(
                'SELECT days_allowed FROM leave_types WHERE id = $1',
                [leave_type_id]
            );

            const usedLeaves = await pool.query(`
                SELECT COALESCE(SUM(
                    EXTRACT(DAY FROM (end_date - start_date + INTERVAL '1 day'))
                ), 0) as used_days
                FROM leave_applications
                WHERE staff_id = $1 
                AND leave_type_id = $2 
                AND status = 'approved'
                AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            `, [staff_id, leave_type_id]);

            const daysRequested = Math.ceil(
                (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24) + 1
            );

            if (usedLeaves.rows[0].used_days + daysRequested > leaveType.rows[0].days_allowed) {
                return res.status(400).json({ message: 'Insufficient leave balance' });
            }

            const query = `
                INSERT INTO leave_applications (
                    staff_id, leave_type_id, start_date, end_date, reason
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const result = await pool.query(query, [
                staff_id, leave_type_id, start_date, end_date, reason
            ]);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get leave applications
    getLeaveApplications: async (req, res) => {
        try {
            const { staff_id, status } = req.query;
            let query = `
                SELECT la.*, 
                       lt.name as leave_type,
                       sr.employee_id,
                       u.first_name || ' ' || u.last_name as staff_name,
                       EXTRACT(DAY FROM (la.end_date - la.start_date + INTERVAL '1 day')) as days_requested
                FROM leave_applications la
                JOIN leave_types lt ON la.leave_type_id = lt.id
                JOIN staff_records sr ON la.staff_id = sr.id
                JOIN users u ON sr.user_id = u.id
            `;

            const queryParams = [];
            if (staff_id) {
                query += ` WHERE la.staff_id = $${queryParams.length + 1}`;
                queryParams.push(staff_id);
            }
            if (status) {
                query += queryParams.length ? ' AND' : ' WHERE';
                query += ` la.status = $${queryParams.length + 1}`;
                queryParams.push(status);
            }

            query += ' ORDER BY la.created_at DESC';

            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Process leave application
    processLeaveApplication: async (req, res) => {
        try {
            const { leaveId } = req.params;
            const { status, approved_by } = req.body;

            const query = `
                UPDATE leave_applications
                SET status = $1,
                    approved_by = $2,
                    approved_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;

            const result = await pool.query(query, [status, approved_by, leaveId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Leave application not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get leave balance
    getLeaveBalance: async (req, res) => {
        try {
            const { staffId } = req.params;

            const query = `
                SELECT 
                    lt.id,
                    lt.name,
                    lt.days_allowed,
                    COALESCE(SUM(
                        CASE 
                            WHEN la.status = 'approved' THEN
                                EXTRACT(DAY FROM (la.end_date - la.start_date + INTERVAL '1 day'))
                            ELSE 0
                        END
                    ), 0) as days_used
                FROM leave_types lt
                LEFT JOIN leave_applications la ON 
                    lt.id = la.leave_type_id AND 
                    la.staff_id = $1 AND 
                    EXTRACT(YEAR FROM la.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY lt.id, lt.name, lt.days_allowed
                ORDER BY lt.name
            `;

            const result = await pool.query(query, [staffId]);
            
            const leaveBalance = result.rows.map(row => ({
                ...row,
                days_remaining: row.days_allowed - row.days_used
            }));

            res.json(leaveBalance);
        } catch (error) {
            handleError(res, error);
        }
    }
};

export default leaveController; 