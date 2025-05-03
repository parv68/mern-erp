import { pool } from '../../db/connection.js';
import { handleError } from '../../utils/errorHandler.js';

const payrollController = {
    // Generate payroll for a staff member
    generatePayroll: async (req, res) => {
        try {
            const { staff_id, month, year, allowances, deductions } = req.body;

            // Get staff basic salary
            const staffRecord = await pool.query(
                'SELECT salary FROM staff_records WHERE id = $1',
                [staff_id]
            );

            if (staffRecord.rows.length === 0) {
                return res.status(404).json({ message: 'Staff record not found' });
            }

            const basic_salary = staffRecord.rows[0].salary;

            // Calculate total allowances
            const totalAllowances = Object.values(allowances || {}).reduce(
                (sum, amount) => sum + parseFloat(amount), 0
            );

            // Calculate total deductions
            const totalDeductions = Object.values(deductions || {}).reduce(
                (sum, amount) => sum + parseFloat(amount), 0
            );

            // Calculate net salary
            const net_salary = basic_salary + totalAllowances - totalDeductions;

            const query = `
                INSERT INTO payroll (
                    staff_id, month, year, basic_salary,
                    allowances, deductions, net_salary
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (staff_id, month, year)
                DO UPDATE SET
                    basic_salary = EXCLUDED.basic_salary,
                    allowances = EXCLUDED.allowances,
                    deductions = EXCLUDED.deductions,
                    net_salary = EXCLUDED.net_salary
                RETURNING *
            `;

            const values = [
                staff_id, month, year, basic_salary,
                allowances, deductions, net_salary
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get payroll records for a staff member
    getStaffPayroll: async (req, res) => {
        try {
            const { staffId } = req.params;
            const { year } = req.query;

            const query = `
                SELECT p.*,
                       sr.employee_id,
                       u.first_name || ' ' || u.last_name as staff_name
                FROM payroll p
                JOIN staff_records sr ON p.staff_id = sr.id
                JOIN users u ON sr.user_id = u.id
                WHERE p.staff_id = $1
                ${year ? 'AND p.year = $2' : ''}
                ORDER BY p.year DESC, p.month DESC
            `;

            const values = year ? [staffId, year] : [staffId];
            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get all payroll records (admin/accountant)
    getAllPayroll: async (req, res) => {
        try {
            const { month, year, status } = req.query;

            let query = `
                SELECT p.*,
                       sr.employee_id,
                       u.first_name || ' ' || u.last_name as staff_name
                FROM payroll p
                JOIN staff_records sr ON p.staff_id = sr.id
                JOIN users u ON sr.user_id = u.id
                WHERE 1=1
            `;

            const values = [];
            if (month) {
                values.push(month);
                query += ` AND p.month = $${values.length}`;
            }
            if (year) {
                values.push(year);
                query += ` AND p.year = $${values.length}`;
            }
            if (status) {
                values.push(status);
                query += ` AND p.payment_status = $${values.length}`;
            }

            query += ' ORDER BY p.year DESC, p.month DESC, sr.employee_id';

            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Process payroll payment
    processPayment: async (req, res) => {
        try {
            const { payrollId } = req.params;

            const query = `
                UPDATE payroll
                SET payment_status = 'paid',
                    payment_date = CURRENT_TIMESTAMP
                WHERE id = $1 AND payment_status = 'pending'
                RETURNING *
            `;

            const result = await pool.query(query, [payrollId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Payroll record not found or already processed'
                });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get payroll summary
    getPayrollSummary: async (req, res) => {
        try {
            const { month, year } = req.query;

            const query = `
                SELECT 
                    COUNT(*) as total_staff,
                    SUM(basic_salary) as total_basic_salary,
                    SUM(net_salary) as total_net_salary,
                    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
                    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count
                FROM payroll
                WHERE month = $1 AND year = $2
            `;

            const result = await pool.query(query, [month, year]);
            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    }
};

export default payrollController; 