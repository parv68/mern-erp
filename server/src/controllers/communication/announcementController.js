const pool = require('../../config/database');
const { handleError } = require('../../utils/errorHandler');

const announcementController = {
    // Create a new announcement
    createAnnouncement: async (req, res) => {
        try {
            const { title, content, type, target_class, priority } = req.body;
            const creator_id = req.user.id;

            const query = `
                INSERT INTO announcements (title, content, type, target_class, priority, creator_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            const values = [title, content, type, target_class, priority, creator_id];
            const result = await pool.query(query, values);

            // Create notifications for relevant users
            if (type === 'global') {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title, content, reference_id)
                    SELECT id, 'announcement', $1, $2, $3
                    FROM users WHERE id != $4
                `, [title, content, result.rows[0].id, creator_id]);
            } else if (type === 'class' && target_class) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title, content, reference_id)
                    SELECT u.id, 'announcement', $1, $2, $3
                    FROM users u
                    JOIN student_classes sc ON u.id = sc.student_id
                    WHERE sc.class_id = $4 AND u.id != $5
                `, [title, content, result.rows[0].id, target_class, creator_id]);
            }

            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get all announcements based on user role and access
    getAnnouncements: async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            let query;
            let values;

            if (userRole === 'admin') {
                query = `
                    SELECT a.*, u.first_name || ' ' || u.last_name as creator_name
                    FROM announcements a
                    JOIN users u ON a.creator_id = u.id
                    ORDER BY a.created_at DESC
                `;
                values = [];
            } else if (userRole === 'teacher') {
                query = `
                    SELECT a.*, u.first_name || ' ' || u.last_name as creator_name
                    FROM announcements a
                    JOIN users u ON a.creator_id = u.id
                    WHERE a.type = 'global' 
                    OR a.type = 'staff'
                    OR (a.type = 'class' AND a.target_class IN (
                        SELECT class_id FROM teacher_classes WHERE teacher_id = $1
                    ))
                    ORDER BY a.created_at DESC
                `;
                values = [userId];
            } else {
                // For students and parents
                query = `
                    SELECT a.*, u.first_name || ' ' || u.last_name as creator_name
                    FROM announcements a
                    JOIN users u ON a.creator_id = u.id
                    WHERE a.type = 'global'
                    OR (a.type = 'class' AND a.target_class IN (
                        SELECT class_id FROM student_classes WHERE student_id = $1
                    ))
                    ORDER BY a.created_at DESC
                `;
                values = [userId];
            }

            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Mark announcement as read
    markAsRead: async (req, res) => {
        try {
            const { announcementId } = req.params;
            const userId = req.user.id;

            await pool.query(`
                INSERT INTO announcement_reads (announcement_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT (announcement_id, user_id) DO NOTHING
            `, [announcementId, userId]);

            res.json({ message: 'Announcement marked as read' });
        } catch (error) {
            handleError(res, error);
        }
    },

    // Delete announcement (admin only)
    deleteAnnouncement: async (req, res) => {
        try {
            const { announcementId } = req.params;
            const userId = req.user.id;

            const result = await pool.query(`
                DELETE FROM announcements
                WHERE id = $1 AND creator_id = $2
                RETURNING *
            `, [announcementId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Announcement not found or unauthorized' });
            }

            res.json({ message: 'Announcement deleted successfully' });
        } catch (error) {
            handleError(res, error);
        }
    }
};

module.exports = announcementController; 