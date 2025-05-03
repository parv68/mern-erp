import { pool } from '../../db/connection.js';
import { handleError } from '../../utils/errorHandler.js';

const newsletterController = {
    // Create a new newsletter
    createNewsletter: async (req, res) => {
        try {
            const { title, content, target_audience, template, schedule_date } = req.body;
            const creator_id = req.user.id;

            const query = `
                INSERT INTO newsletters (
                    title, content, target_audience, template, 
                    schedule_date, creator_id, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const status = schedule_date ? 'scheduled' : 'draft';
            const values = [
                title, content, target_audience, template,
                schedule_date, creator_id, status
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get all newsletters
    getNewsletters: async (req, res) => {
        try {
            const query = `
                SELECT n.*, u.first_name || ' ' || u.last_name as creator_name,
                       COUNT(nr.id) as recipient_count
                FROM newsletters n
                JOIN users u ON n.creator_id = u.id
                LEFT JOIN newsletter_recipients nr ON n.id = nr.newsletter_id
                GROUP BY n.id, u.first_name, u.last_name
                ORDER BY n.created_at DESC
            `;
            
            const result = await pool.query(query);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Send newsletter now
    sendNewsletter: async (req, res) => {
        try {
            const { newsletterId } = req.params;
            const userId = req.user.id;

            // Get newsletter details
            const newsletter = await pool.query(`
                SELECT * FROM newsletters WHERE id = $1 AND creator_id = $2
            `, [newsletterId, userId]);

            if (newsletter.rows.length === 0) {
                return res.status(404).json({ message: 'Newsletter not found or unauthorized' });
            }

            const { target_audience, title, content } = newsletter.rows[0];

            // Get target recipients based on audience
            let recipientQuery = `SELECT id FROM users WHERE id != $1`;
            let queryParams = [userId];

            if (target_audience !== 'all') {
                recipientQuery += ` AND role = $2`;
                queryParams.push(target_audience.slice(0, -1)); // Remove 's' from end (parents -> parent)
            }

            const recipients = await pool.query(recipientQuery, queryParams);

            // Create newsletter recipients and notifications
            await Promise.all(recipients.rows.map(recipient => {
                return Promise.all([
                    // Create newsletter recipient record
                    pool.query(`
                        INSERT INTO newsletter_recipients (newsletter_id, user_id)
                        VALUES ($1, $2)
                        ON CONFLICT (newsletter_id, user_id) DO NOTHING
                    `, [newsletterId, recipient.id]),

                    // Create notification
                    pool.query(`
                        INSERT INTO notifications (
                            user_id, type, title, content, reference_id
                        )
                        VALUES ($1, 'newsletter', $2, $3, $4)
                    `, [recipient.id, title, content, newsletterId])
                ]);
            }));

            // Update newsletter status
            await pool.query(`
                UPDATE newsletters
                SET status = 'sent', sent_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [newsletterId]);

            res.json({ message: 'Newsletter sent successfully' });
        } catch (error) {
            handleError(res, error);
        }
    },

    // Delete newsletter
    deleteNewsletter: async (req, res) => {
        try {
            const { newsletterId } = req.params;
            const userId = req.user.id;

            const result = await pool.query(`
                DELETE FROM newsletters
                WHERE id = $1 AND creator_id = $2 AND status = 'draft'
                RETURNING *
            `, [newsletterId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Newsletter not found, unauthorized, or already sent'
                });
            }

            res.json({ message: 'Newsletter deleted successfully' });
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get newsletter statistics
    getNewsletterStats: async (req, res) => {
        try {
            const { newsletterId } = req.params;
            const userId = req.user.id;

            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_recipients,
                    COUNT(opened_at) as opened_count,
                    ROUND(COUNT(opened_at)::numeric / COUNT(*)::numeric * 100, 2) as open_rate
                FROM newsletter_recipients
                WHERE newsletter_id = $1
            `, [newsletterId]);

            res.json(stats.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    }
};

export default newsletterController; 