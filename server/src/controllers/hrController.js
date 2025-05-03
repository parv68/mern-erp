const { pool } = require('../db');

// Staff Management
const staffController = {
  // Get all staff members
  async getAllStaff(req, res) {
    try {
      const result = await pool.query(`
        SELECT s.*, u.username, d.name as department_name, p.name as position_name
        FROM staff s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN departments d ON s.department = d.id
        LEFT JOIN positions p ON s.position = p.id
        ORDER BY s.first_name, s.last_name
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting staff:', error);
      res.status(500).json({ error: 'Failed to get staff' });
    }
  },

  // Get a single staff member
  async getStaffById(req, res) {
    const { id } = req.params;
    
    try {
      const result = await pool.query(`
        SELECT s.*, u.username, d.name as department_name, p.name as position_name
        FROM staff s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN departments d ON s.department = d.id
        LEFT JOIN positions p ON s.position = p.id
        WHERE s.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting staff member:', error);
      res.status(500).json({ error: 'Failed to get staff member' });
    }
  },

  // Create a new staff member
  async createStaff(req, res) {
    const { 
      employee_id, user_id, first_name, last_name, email, phone, 
      address, position, department, joining_date, salary, status 
    } = req.body;
    
    try {
      const result = await pool.query(`
        INSERT INTO staff (
          employee_id, user_id, first_name, last_name, email, phone,
          address, position, department, joining_date, salary, status
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        employee_id, user_id, first_name, last_name, email, phone,
        address, position, department, joining_date, salary, status
      ]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating staff member:', error);
      res.status(500).json({ error: 'Failed to create staff member' });
    }
  },

  // Update a staff member
  async updateStaff(req, res) {
    const { id } = req.params;
    const { 
      employee_id, user_id, first_name, last_name, email, phone, 
      address, position, department, joining_date, salary, status 
    } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE staff 
        SET 
          employee_id = $1,
          user_id = $2,
          first_name = $3,
          last_name = $4,
          email = $5,
          phone = $6,
          address = $7,
          position = $8,
          department = $9,
          joining_date = $10,
          salary = $11,
          status = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `, [
        employee_id, user_id, first_name, last_name, email, phone,
        address, position, department, joining_date, salary, status, id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ error: 'Failed to update staff member' });
    }
  },

  // Delete a staff member
  async deleteStaff(req, res) {
    const { id } = req.params;
    
    try {
      const result = await pool.query('DELETE FROM staff WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
      
      res.json({ message: 'Staff member deleted successfully', deletedStaff: result.rows[0] });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ error: 'Failed to delete staff member' });
    }
  }
};

// Leave Management
const leaveController = {
  // Get all leave applications
  async getAllLeaves(req, res) {
    try {
      const result = await pool.query(`
        SELECT l.*, s.first_name || ' ' || s.last_name AS staff_name,
               lt.name AS leave_type_name
        FROM leave_applications l
        JOIN staff s ON l.staff_id = s.id
        JOIN leave_types lt ON l.leave_type_id = lt.id
        ORDER BY l.start_date DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting leave applications:', error);
      res.status(500).json({ error: 'Failed to get leave applications' });
    }
  },

  // Get leave applications for a specific staff member
  async getStaffLeaves(req, res) {
    const { staffId } = req.params;
    
    try {
      const result = await pool.query(`
        SELECT l.*, lt.name AS leave_type_name
        FROM leave_applications l
        JOIN leave_types lt ON l.leave_type_id = lt.id
        WHERE l.staff_id = $1
        ORDER BY l.start_date DESC
      `, [staffId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting staff leave applications:', error);
      res.status(500).json({ error: 'Failed to get staff leave applications' });
    }
  },

  // Create a new leave application
  async createLeave(req, res) {
    const { 
      staff_id, leave_type_id, start_date, end_date, 
      days, reason, status = 'pending'
    } = req.body;
    
    try {
      // Check leave balance
      const balanceResult = await pool.query(`
        SELECT * FROM leave_balances
        WHERE staff_id = $1 AND leave_type_id = $2 AND year = $3
      `, [staff_id, leave_type_id, new Date(start_date).getFullYear()]);
      
      if (balanceResult.rows.length > 0) {
        const balance = balanceResult.rows[0];
        const remainingDays = balance.days_allowed - balance.days_used;
        
        if (days > remainingDays) {
          return res.status(400).json({ 
            error: 'Insufficient leave balance', 
            requested: days, 
            available: remainingDays 
          });
        }
      }

      const result = await pool.query(`
        INSERT INTO leave_applications (
          staff_id, leave_type_id, start_date, end_date, 
          days, reason, status
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        staff_id, leave_type_id, start_date, end_date, 
        days, reason, status
      ]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating leave application:', error);
      res.status(500).json({ error: 'Failed to create leave application' });
    }
  },

  // Update a leave application status
  async updateLeaveStatus(req, res) {
    const { id } = req.params;
    const { status, admin_comment, approved_by } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE leave_applications 
        SET 
          status = $1,
          admin_comment = $2,
          approved_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [status, admin_comment, approved_by, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Leave application not found' });
      }
      
      // Update leave balance if approved
      if (status === 'approved') {
        const leave = result.rows[0];
        await pool.query(`
          UPDATE leave_balances
          SET days_used = days_used + $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE staff_id = $2 AND leave_type_id = $3 AND year = $4
        `, [
          leave.days, 
          leave.staff_id, 
          leave.leave_type_id, 
          new Date(leave.start_date).getFullYear()
        ]);
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating leave status:', error);
      res.status(500).json({ error: 'Failed to update leave status' });
    }
  },

  // Get leave balances for a staff member
  async getLeaveBalances(req, res) {
    const { staffId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    try {
      const result = await pool.query(`
        SELECT lb.*, lt.name AS leave_type_name
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        WHERE lb.staff_id = $1 AND lb.year = $2
      `, [staffId, year]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting leave balances:', error);
      res.status(500).json({ error: 'Failed to get leave balances' });
    }
  }
};

// Payroll Management
const payrollController = {
  // Get all payroll records
  async getAllPayrolls(req, res) {
    try {
      const result = await pool.query(`
        SELECT p.*, s.first_name || ' ' || s.last_name AS staff_name,
               s.employee_id, d.name AS department, pos.name AS position
        FROM payroll p
        JOIN staff s ON p.staff_id = s.id
        LEFT JOIN departments d ON s.department = d.id
        LEFT JOIN positions pos ON s.position = pos.id
        ORDER BY p.year DESC, p.month DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting payroll records:', error);
      res.status(500).json({ error: 'Failed to get payroll records' });
    }
  },

  // Generate payroll for all staff for current month/year
  async generatePayroll(req, res) {
    const { month, year } = req.body;
    
    try {
      // Get all active staff
      const staffResult = await pool.query(`
        SELECT id, salary FROM staff WHERE status = 'active'
      `);
      
      const payrollPromises = staffResult.rows.map(async (staff) => {
        // Check if payroll already exists for this month/year
        const existingResult = await pool.query(`
          SELECT id FROM payroll 
          WHERE staff_id = $1 AND month = $2 AND year = $3
        `, [staff.id, month, year]);
        
        if (existingResult.rows.length > 0) {
          return null; // Skip if already exists
        }
        
        // Create payroll record
        const basicSalary = staff.salary || 0;
        // In a real app, calculate allowances, deductions, tax based on rules
        const allowances = basicSalary * 0.1; // Example: 10% allowance
        const deductions = basicSalary * 0.05; // Example: 5% deduction
        const tax = basicSalary * 0.15; // Example: 15% tax
        const netSalary = basicSalary + allowances - deductions - tax;
        
        const payrollResult = await pool.query(`
          INSERT INTO payroll (
            staff_id, month, year, basic_salary, allowances,
            deductions, tax, net_salary, status, created_by
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          staff.id, month, year, basicSalary, allowances,
          deductions, tax, netSalary, 'pending', req.user.id
        ]);
        
        return payrollResult.rows[0];
      });
      
      const results = await Promise.all(payrollPromises);
      const newPayrolls = results.filter(Boolean);
      
      res.status(201).json({
        message: `Generated ${newPayrolls.length} payroll records`,
        payrolls: newPayrolls
      });
    } catch (error) {
      console.error('Error generating payroll:', error);
      res.status(500).json({ error: 'Failed to generate payroll' });
    }
  },

  // Get a staff member's payroll history
  async getStaffPayroll(req, res) {
    const { staffId } = req.params;
    
    try {
      const result = await pool.query(`
        SELECT * FROM payroll 
        WHERE staff_id = $1
        ORDER BY year DESC, month DESC
      `, [staffId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting staff payroll:', error);
      res.status(500).json({ error: 'Failed to get staff payroll' });
    }
  },

  // Update payroll status
  async updatePayrollStatus(req, res) {
    const { id } = req.params;
    const { status, payment_date, payment_method } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE payroll 
        SET 
          status = $1,
          payment_date = $2,
          payment_method = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [status, payment_date, payment_method, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payroll record not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating payroll status:', error);
      res.status(500).json({ error: 'Failed to update payroll status' });
    }
  }
};

// Performance Review Management
const performanceController = {
  // Get all performance reviews
  async getAllReviews(req, res) {
    try {
      const result = await pool.query(`
        SELECT pr.*, 
               s.first_name || ' ' || s.last_name AS staff_name,
               u.username AS reviewer_name
        FROM performance_reviews pr
        JOIN staff s ON pr.staff_id = s.id
        LEFT JOIN users u ON pr.reviewer_id = u.id
        ORDER BY pr.review_date DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting performance reviews:', error);
      res.status(500).json({ error: 'Failed to get performance reviews' });
    }
  },

  // Get performance reviews for a specific staff member
  async getStaffReviews(req, res) {
    const { staffId } = req.params;
    
    try {
      const result = await pool.query(`
        SELECT pr.*, u.username AS reviewer_name
        FROM performance_reviews pr
        LEFT JOIN users u ON pr.reviewer_id = u.id
        WHERE pr.staff_id = $1
        ORDER BY pr.review_date DESC
      `, [staffId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting staff performance reviews:', error);
      res.status(500).json({ error: 'Failed to get staff performance reviews' });
    }
  },

  // Create a new performance review
  async createReview(req, res) {
    const { 
      staff_id, review_period, review_date, reviewer_id,
      performance_areas, strengths, areas_for_improvement,
      goals, overall_comments, overall_rating, status
    } = req.body;
    
    try {
      const result = await pool.query(`
        INSERT INTO performance_reviews (
          staff_id, review_period, review_date, reviewer_id,
          performance_areas, strengths, areas_for_improvement,
          goals, overall_comments, overall_rating, status
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        staff_id, review_period, review_date, reviewer_id,
        JSON.stringify(performance_areas), strengths, areas_for_improvement,
        goals, overall_comments, overall_rating, status
      ]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating performance review:', error);
      res.status(500).json({ error: 'Failed to create performance review' });
    }
  },

  // Update a performance review
  async updateReview(req, res) {
    const { id } = req.params;
    const { 
      staff_id, review_period, review_date, reviewer_id,
      performance_areas, strengths, areas_for_improvement,
      goals, overall_comments, overall_rating, status
    } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE performance_reviews 
        SET 
          staff_id = $1,
          review_period = $2,
          review_date = $3,
          reviewer_id = $4,
          performance_areas = $5,
          strengths = $6,
          areas_for_improvement = $7,
          goals = $8,
          overall_comments = $9,
          overall_rating = $10,
          status = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `, [
        staff_id, review_period, review_date, reviewer_id,
        JSON.stringify(performance_areas), strengths, areas_for_improvement,
        goals, overall_comments, overall_rating, status, id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Performance review not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating performance review:', error);
      res.status(500).json({ error: 'Failed to update performance review' });
    }
  },

  // Employee acknowledges a review and provides comments
  async acknowledgeReview(req, res) {
    const { id } = req.params;
    const { employee_comments } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE performance_reviews 
        SET 
          status = 'acknowledged',
          employee_comments = $1,
          acknowledged_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [employee_comments, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Performance review not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error acknowledging performance review:', error);
      res.status(500).json({ error: 'Failed to acknowledge performance review' });
    }
  }
};

module.exports = {
  staffController,
  leaveController,
  payrollController,
  performanceController
}; 