const pool = require('../../config/database');
const { handleError } = require('../../utils/errorHandler');

const staffController = {
    // Create staff record
    createStaffRecord: async (req, res) => {
        try {
            const {
                user_id, employee_id, department, designation, joining_date,
                contract_type, contract_end_date, salary, bank_account,
                emergency_contact, documents
            } = req.body;

            const query = `
                INSERT INTO staff_records (
                    user_id, employee_id, department, designation, joining_date,
                    contract_type, contract_end_date, salary, bank_account,
                    emergency_contact, documents
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const values = [
                user_id, employee_id, department, designation, joining_date,
                contract_type, contract_end_date, salary, bank_account,
                emergency_contact, documents
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get all staff records
    getAllStaffRecords: async (req, res) => {
        try {
            const query = `
                SELECT sr.*, 
                       u.first_name, u.last_name, u.email,
                       u.role
                FROM staff_records sr
                JOIN users u ON sr.user_id = u.id
                ORDER BY sr.created_at DESC
            `;

            const result = await pool.query(query);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get staff record by ID
    getStaffRecordById: async (req, res) => {
        try {
            const { staffId } = req.params;

            const query = `
                SELECT sr.*, 
                       u.first_name, u.last_name, u.email,
                       u.role
                FROM staff_records sr
                JOIN users u ON sr.user_id = u.id
                WHERE sr.id = $1
            `;

            const result = await pool.query(query, [staffId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Staff record not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Update staff record
    updateStaffRecord: async (req, res) => {
        try {
            const { staffId } = req.params;
            const {
                department, designation, contract_type, contract_end_date,
                salary, bank_account, emergency_contact, documents
            } = req.body;

            const query = `
                UPDATE staff_records
                SET department = $1,
                    designation = $2,
                    contract_type = $3,
                    contract_end_date = $4,
                    salary = $5,
                    bank_account = $6,
                    emergency_contact = $7,
                    documents = $8
                WHERE id = $9
                RETURNING *
            `;

            const values = [
                department, designation, contract_type, contract_end_date,
                salary, bank_account, emergency_contact, documents, staffId
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Staff record not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Delete staff record
    deleteStaffRecord: async (req, res) => {
        try {
            const { staffId } = req.params;

            const result = await pool.query(
                'DELETE FROM staff_records WHERE id = $1 RETURNING *',
                [staffId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Staff record not found' });
            }

            res.json({ message: 'Staff record deleted successfully' });
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get staff attendance
    getStaffAttendance: async (req, res) => {
        try {
            const { staffId } = req.params;
            const { startDate, endDate } = req.query;

            const query = `
                SELECT *
                FROM staff_attendance
                WHERE staff_id = $1
                AND date BETWEEN $2 AND $3
                ORDER BY date DESC
            `;

            const result = await pool.query(query, [staffId, startDate, endDate]);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Mark staff attendance
    markAttendance: async (req, res) => {
        try {
            const { staffId } = req.params;
            const { date, check_in, check_out, status, notes } = req.body;

            const query = `
                INSERT INTO staff_attendance (staff_id, date, check_in, check_out, status, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (staff_id, date)
                DO UPDATE SET
                    check_in = EXCLUDED.check_in,
                    check_out = EXCLUDED.check_out,
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes
                RETURNING *
            `;

            const result = await pool.query(query, [
                staffId, date, check_in, check_out, status, notes
            ]);

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    }
};

module.exports = staffController; 