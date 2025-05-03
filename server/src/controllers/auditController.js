import { pool } from '../db/connection.js';

/**
 * Get audit logs with optional filtering
 */
export const getLogs = async (req, res) => {
    try {
        const { user_id, action, resource_type, start_date, end_date, limit = 100, offset = 0 } = req.query;
        
        // Build query based on filters
        let query = `
            SELECT al.*, u.email as user_email 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (user_id) {
            query += ` AND al.user_id = $${paramCount++}`;
            params.push(user_id);
        }
        
        if (action) {
            query += ` AND al.action = $${paramCount++}`;
            params.push(action);
        }
        
        if (resource_type) {
            query += ` AND al.resource_type = $${paramCount++}`;
            params.push(resource_type);
        }
        
        if (start_date) {
            query += ` AND al.created_at >= $${paramCount++}`;
            params.push(start_date);
        }
        
        if (end_date) {
            query += ` AND al.created_at <= $${paramCount++}`;
            params.push(end_date);
        }
        
        // Add sorting, limit and offset
        query += ` ORDER BY al.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(limit, offset);
        
        const { rows } = await pool.query(query, params);
        
        // Get total count for pagination
        const countQuery = query.split('ORDER BY')[0].replace('al.*, u.email as user_email', 'COUNT(*)');
        const countParams = params.slice(0, -2); // Remove limit and offset params
        const countResult = await pool.query(countQuery, countParams);
        
        res.json({
            total: parseInt(countResult.rows[0].count),
            logs: rows
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};

/**
 * Create a new audit log entry
 */
export const createLog = async (req, res) => {
    try {
        const { action, resource_type, resource_id, description } = req.body;
        const user_id = req.user.id;
        
        const { rows } = await pool.query(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [user_id, action, resource_type, resource_id, description]
        );
        
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({ message: 'Error creating audit log' });
    }
};

/**
 * Create a log entry without going through the API (for internal use)
 */
export const logActivity = async (userId, action, resourceType, resourceId, description) => {
    try {
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, action, resourceType, resourceId, description]
        );
        return true;
    } catch (error) {
        console.error('Error logging activity:', error);
        return false;
    }
};

export default {
    getLogs,
    createLog,
    logActivity
}; 