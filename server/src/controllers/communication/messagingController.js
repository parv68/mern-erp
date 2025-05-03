const pool = require('../../config/database');
const { handleError } = require('../../utils/errorHandler');

const messagingController = {
    // Get all conversations for a user
    getConversations: async (req, res) => {
        try {
            const userId = req.user.id;
            
            const query = `
                SELECT 
                    c.*,
                    CASE 
                        WHEN c.participant1_id = $1 THEN 
                            u2.first_name || ' ' || u2.last_name 
                        ELSE 
                            u1.first_name || ' ' || u1.last_name 
                    END as participant_name,
                    m.content as last_message,
                    m.created_at as last_message_time
                FROM conversations c
                JOIN users u1 ON c.participant1_id = u1.id
                JOIN users u2 ON c.participant2_id = u2.id
                LEFT JOIN LATERAL (
                    SELECT content, created_at
                    FROM messages
                    WHERE conversation_id = c.id
                    ORDER BY created_at DESC
                    LIMIT 1
                ) m ON true
                WHERE c.participant1_id = $1 OR c.participant2_id = $1
                ORDER BY m.created_at DESC NULLS LAST
            `;
            
            const result = await pool.query(query, [userId]);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get messages for a specific conversation
    getMessages: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            // Verify user is part of the conversation
            const conversationCheck = await pool.query(`
                SELECT * FROM conversations
                WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)
            `, [conversationId, userId]);

            if (conversationCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Unauthorized access to conversation' });
            }

            const query = `
                SELECT m.*, u.first_name || ' ' || u.last_name as sender_name
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = $1
                ORDER BY m.created_at ASC
            `;
            
            const result = await pool.query(query, [conversationId]);
            
            // Mark messages as read
            await pool.query(`
                UPDATE messages
                SET read_at = CURRENT_TIMESTAMP
                WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
            `, [conversationId, userId]);

            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Send a new message
    sendMessage: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const { content } = req.body;
            const senderId = req.user.id;

            // Verify user is part of the conversation
            const conversationCheck = await pool.query(`
                SELECT * FROM conversations
                WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)
            `, [conversationId, senderId]);

            if (conversationCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Unauthorized to send message in this conversation' });
            }

            // Insert message
            const result = await pool.query(`
                INSERT INTO messages (conversation_id, sender_id, content)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [conversationId, senderId, content]);

            // Create notification for recipient
            const recipientId = conversationCheck.rows[0].participant1_id === senderId
                ? conversationCheck.rows[0].participant2_id
                : conversationCheck.rows[0].participant1_id;

            await pool.query(`
                INSERT INTO notifications (user_id, type, title, content, reference_id)
                VALUES ($1, 'message', 'New Message', $2, $3)
            `, [recipientId, content, conversationId]);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Start a new conversation
    startConversation: async (req, res) => {
        try {
            const { participant_id } = req.body;
            const userId = req.user.id;

            if (participant_id === userId) {
                return res.status(400).json({ message: 'Cannot start conversation with yourself' });
            }

            // Check if conversation already exists
            const existingConversation = await pool.query(`
                SELECT * FROM conversations
                WHERE (participant1_id = $1 AND participant2_id = $2)
                OR (participant1_id = $2 AND participant2_id = $1)
            `, [userId, participant_id]);

            if (existingConversation.rows.length > 0) {
                return res.json(existingConversation.rows[0]);
            }

            // Create new conversation
            const result = await pool.query(`
                INSERT INTO conversations (participant1_id, participant2_id)
                VALUES ($1, $2)
                RETURNING *
            `, [userId, participant_id]);

            // Add participant name to response
            const participantInfo = await pool.query(`
                SELECT first_name || ' ' || last_name as participant_name
                FROM users WHERE id = $1
            `, [participant_id]);

            res.status(201).json({
                ...result.rows[0],
                participant_name: participantInfo.rows[0].participant_name
            });
        } catch (error) {
            handleError(res, error);
        }
    }
};

module.exports = messagingController; 