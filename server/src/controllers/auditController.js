const { User } = require('../models');
const { pool } = require('../db');

const auditController = {
  // Get audit logs with pagination and filtering
  async getLogs(req, res) {
    try {
      const { 
        page = 0, 
        limit = 10, 
        userId, 
        startDate, 
        endDate, 
        success, 
        action 
      } = req.query;

      // Build the WHERE clause based on filters
      const whereConditions = [];
      const params = [];
      let paramCount = 1;

      if (userId) {
        whereConditions.push(`user_id = $${paramCount++}`);
        params.push(userId);
      }

      if (startDate) {
        whereConditions.push(`login_timestamp >= $${paramCount++}`);
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`login_timestamp <= $${paramCount++}`);
        params.push(endDate + ' 23:59:59');
      }

      if (success !== undefined && success !== '') {
        whereConditions.push(`success = $${paramCount++}`);
        params.push(success === 'true');
      }

      if (action) {
        whereConditions.push(`action = $${paramCount++}`);
        params.push(action);
      }

      const whereClause = whereConditions.length 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Count total logs matching the criteria
      const countQuery = `
        SELECT COUNT(*) FROM user_login_audit
        ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Query for paginated logs
      const offset = page * limit;
      const logsQuery = `
        SELECT a.*, u.username, u.first_name, u.last_name
        FROM user_login_audit a
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.login_timestamp DESC
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;

      const logsParams = [...params, limit, offset];
      const logsResult = await pool.query(logsQuery, logsParams);

      // Format the result
      const logs = logsResult.rows.map(row => {
        const { username, first_name, last_name, ...logData } = row;
        return {
          ...logData,
          user: username ? {
            username,
            first_name,
            last_name
          } : null
        };
      });

      res.json({
        logs,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Log an audit event programmatically
  async createLog(req, res) {
    try {
      const { userId, success, action } = req.body;
      
      const result = await pool.query(
        'INSERT INTO user_login_audit (user_id, ip_address, user_agent, success, action) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, req.ip, req.headers['user-agent'], success, action]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = auditController; 