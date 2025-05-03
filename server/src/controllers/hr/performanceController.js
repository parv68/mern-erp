const pool = require('../../config/database');
const { handleError } = require('../../utils/errorHandler');

const performanceController = {
    // Create performance review
    createReview: async (req, res) => {
        try {
            const {
                staff_id, review_period_start, review_period_end,
                performance_score, achievements, areas_of_improvement,
                goals_set
            } = req.body;
            const reviewer_id = req.user.id;

            const query = `
                INSERT INTO performance_reviews (
                    staff_id, reviewer_id, review_period_start,
                    review_period_end, performance_score, achievements,
                    areas_of_improvement, goals_set
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                staff_id, reviewer_id, review_period_start,
                review_period_end, performance_score, achievements,
                areas_of_improvement, goals_set
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get staff reviews
    getStaffReviews: async (req, res) => {
        try {
            const { staffId } = req.params;

            const query = `
                SELECT pr.*,
                       u1.first_name || ' ' || u1.last_name as staff_name,
                       u2.first_name || ' ' || u2.last_name as reviewer_name
                FROM performance_reviews pr
                JOIN staff_records sr ON pr.staff_id = sr.id
                JOIN users u1 ON sr.user_id = u1.id
                JOIN users u2 ON pr.reviewer_id = u2.id
                WHERE pr.staff_id = $1
                ORDER BY pr.review_period_end DESC
            `;

            const result = await pool.query(query, [staffId]);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get review by ID
    getReviewById: async (req, res) => {
        try {
            const { reviewId } = req.params;

            const query = `
                SELECT pr.*,
                       u1.first_name || ' ' || u1.last_name as staff_name,
                       u2.first_name || ' ' || u2.last_name as reviewer_name
                FROM performance_reviews pr
                JOIN staff_records sr ON pr.staff_id = sr.id
                JOIN users u1 ON sr.user_id = u1.id
                JOIN users u2 ON pr.reviewer_id = u2.id
                WHERE pr.id = $1
            `;

            const result = await pool.query(query, [reviewId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Review not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Update review
    updateReview: async (req, res) => {
        try {
            const { reviewId } = req.params;
            const {
                performance_score, achievements,
                areas_of_improvement, goals_set
            } = req.body;

            const query = `
                UPDATE performance_reviews
                SET performance_score = $1,
                    achievements = $2,
                    areas_of_improvement = $3,
                    goals_set = $4
                WHERE id = $5 AND status = 'draft'
                RETURNING *
            `;

            const result = await pool.query(query, [
                performance_score, achievements,
                areas_of_improvement, goals_set, reviewId
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Review not found or cannot be updated'
                });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Submit review
    submitReview: async (req, res) => {
        try {
            const { reviewId } = req.params;

            const query = `
                UPDATE performance_reviews
                SET status = 'submitted',
                    submitted_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND status = 'draft'
                RETURNING *
            `;

            const result = await pool.query(query, [reviewId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Review not found or already submitted'
                });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Acknowledge review
    acknowledgeReview: async (req, res) => {
        try {
            const { reviewId } = req.params;
            const staff_id = req.user.id;

            const query = `
                UPDATE performance_reviews
                SET status = 'acknowledged',
                    acknowledged_at = CURRENT_TIMESTAMP
                WHERE id = $1 
                AND staff_id = $2
                AND status = 'submitted'
                RETURNING *
            `;

            const result = await pool.query(query, [reviewId, staff_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Review not found or cannot be acknowledged'
                });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get performance statistics
    getPerformanceStats: async (req, res) => {
        try {
            const { department, year } = req.query;

            let query = `
                SELECT 
                    COUNT(*) as total_reviews,
                    ROUND(AVG(performance_score), 2) as avg_score,
                    COUNT(CASE WHEN performance_score >= 4 THEN 1 END) as high_performers,
                    COUNT(CASE WHEN performance_score <= 2 THEN 1 END) as needs_improvement
                FROM performance_reviews pr
                JOIN staff_records sr ON pr.staff_id = sr.id
                WHERE EXTRACT(YEAR FROM review_period_end) = $1
            `;

            const values = [year];
            if (department) {
                query += ` AND sr.department = $2`;
                values.push(department);
            }

            const result = await pool.query(query, values);
            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    }
};

module.exports = performanceController; 