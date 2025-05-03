const pool = require('../config/database');
const { validateFeeStructure, validatePayment } = require('../utils/validators');

// Fee Structure Controllers
exports.createFeeStructure = async (req, res) => {
    try {
        const { class_id, fee_type, amount, frequency, academic_year } = req.body;
        const validation = validateFeeStructure(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        const result = await pool.query(
            'INSERT INTO fee_structures (class_id, fee_type, amount, frequency, academic_year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [class_id, fee_type, amount, frequency, academic_year]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create fee structure' });
    }
};

exports.getFeeStructures = async (req, res) => {
    try {
        const { class_id, academic_year } = req.query;
        let query = 'SELECT * FROM fee_structures WHERE 1=1';
        const params = [];

        if (class_id) {
            params.push(class_id);
            query += ` AND class_id = $${params.length}`;
        }
        if (academic_year) {
            params.push(academic_year);
            query += ` AND academic_year = $${params.length}`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fee structures' });
    }
};

// Payment Controllers
exports.createPayment = async (req, res) => {
    try {
        const { student_id, fee_structure_id, amount_paid, payment_method } = req.body;
        const validation = validatePayment(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        const result = await pool.query(
            'INSERT INTO student_payments (student_id, fee_structure_id, amount_paid, payment_date, payment_method, status) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5) RETURNING *',
            [student_id, fee_structure_id, amount_paid, payment_method, 'pending']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process payment' });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const { student_id } = req.params;
        const result = await pool.query(
            'SELECT sp.*, fs.fee_type, fs.frequency FROM student_payments sp JOIN fee_structures fs ON sp.fee_structure_id = fs.id WHERE sp.student_id = $1 ORDER BY sp.payment_date DESC',
            [student_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
};

// Salary Controllers
exports.createSalaryStructure = async (req, res) => {
    try {
        const { staff_id, basic_salary, allowances, deductions, effective_from } = req.body;
        const result = await pool.query(
            'INSERT INTO salary_structures (staff_id, basic_salary, allowances, deductions, effective_from) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [staff_id, basic_salary, allowances, deductions, effective_from]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create salary structure' });
    }
};

exports.processSalaryPayment = async (req, res) => {
    try {
        const { staff_id, salary_structure_id, payment_month, gross_amount, deductions, net_amount } = req.body;
        const result = await pool.query(
            'INSERT INTO salary_payments (staff_id, salary_structure_id, payment_month, gross_amount, deductions, net_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [staff_id, salary_structure_id, payment_month, gross_amount, deductions, net_amount, 'pending']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process salary payment' });
    }
};

// Reimbursement Controllers
exports.submitReimbursement = async (req, res) => {
    try {
        const { staff_id, amount, description, receipt_url } = req.body;
        const result = await pool.query(
            'INSERT INTO reimbursements (staff_id, amount, description, receipt_url, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [staff_id, amount, description, receipt_url, 'pending']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit reimbursement request' });
    }
};

exports.approveReimbursement = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by, status } = req.body;
        const result = await pool.query(
            'UPDATE reimbursements SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [status, approved_by, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve reimbursement' });
    }
};

// Financial Reports
exports.generateFinancialReport = async (req, res) => {
    try {
        const { start_date, end_date, report_type } = req.query;
        let result;

        switch (report_type) {
            case 'fee_collection':
                result = await pool.query(
                    'SELECT SUM(amount_paid) as total_collected, COUNT(*) as total_transactions FROM student_payments WHERE payment_date BETWEEN $1 AND $2',
                    [start_date, end_date]
                );
                break;
            case 'salary_disbursement':
                result = await pool.query(
                    'SELECT SUM(net_amount) as total_disbursed, COUNT(*) as total_payments FROM salary_payments WHERE payment_date BETWEEN $1 AND $2',
                    [start_date, end_date]
                );
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate financial report' });
    }
}; 