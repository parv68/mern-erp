import { pool } from '../../db/connection.js';
import { handleError } from '../../utils/errorHandler.js';

const notificationController = {
    // Get user's notifications
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.id;
            
            const query = `
                SELECT *
                FROM notifications
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 50
            `;
            
            const result = await pool.query(query, [userId]);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            const result = await pool.query(`
                UPDATE notifications
                SET read_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `, [notificationId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Mark all notifications as read
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.user.id;

            await pool.query(`
                UPDATE notifications
                SET read_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND read_at IS NULL
            `, [userId]);

            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            handleError(res, error);
        }
    },

    // Delete a notification
    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            const result = await pool.query(`
                DELETE FROM notifications
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `, [notificationId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            res.json({ message: 'Notification deleted successfully' });
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get unread notification count
    getUnreadCount: async (req, res) => {
        try {
            const userId = req.user.id;

            const result = await pool.query(`
                SELECT COUNT(*) as unread_count
                FROM notifications
                WHERE user_id = $1 AND read_at IS NULL
            `, [userId]);

            res.json({ unread_count: parseInt(result.rows[0].unread_count) });
        } catch (error) {
            handleError(res, error);
        }
    }
};

export default notificationController; 