import { pool } from '../../db/connection.js';
import { handleError } from '../../utils/errorHandler.js'

const recruitmentController = {
    // Create job opening
    createJobOpening: async (req, res) => {
        try {
            const {
                title, department, position_count, description,
                requirements, closing_date
            } = req.body;
            const created_by = req.user.id;

            const query = `
                INSERT INTO job_openings (
                    title, department, position_count, description,
                    requirements, closing_date, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                title, department, position_count, description,
                requirements, closing_date, created_by
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get all job openings
    getJobOpenings: async (req, res) => {
        try {
            const { status } = req.query;

            let query = `
                SELECT jo.*,
                       u.first_name || ' ' || u.last_name as created_by_name,
                       COUNT(ja.id) as application_count
                FROM job_openings jo
                LEFT JOIN job_applications ja ON jo.id = ja.job_id
                JOIN users u ON jo.created_by = u.id
            `;

            const values = [];
            if (status) {
                query += ` WHERE jo.status = $1`;
                values.push(status);
            }

            query += `
                GROUP BY jo.id, u.first_name, u.last_name
                ORDER BY jo.created_at DESC
            `;

            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Update job opening status
    updateJobStatus: async (req, res) => {
        try {
            const { jobId } = req.params;
            const { status } = req.body;

            const query = `
                UPDATE job_openings
                SET status = $1
                WHERE id = $2
                RETURNING *
            `;

            const result = await pool.query(query, [status, jobId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Job opening not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Submit job application
    submitApplication: async (req, res) => {
        try {
            const { jobId } = req.params;
            const {
                applicant_name, email, phone,
                resume_url, cover_letter
            } = req.body;

            // Check if job is still open
            const jobCheck = await pool.query(
                'SELECT status, closing_date FROM job_openings WHERE id = $1',
                [jobId]
            );

            if (jobCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Job opening not found' });
            }

            if (jobCheck.rows[0].status !== 'open') {
                return res.status(400).json({ message: 'This position is no longer accepting applications' });
            }

            if (new Date(jobCheck.rows[0].closing_date) < new Date()) {
                return res.status(400).json({ message: 'Application deadline has passed' });
            }

            const query = `
                INSERT INTO job_applications (
                    job_id, applicant_name, email, phone,
                    resume_url, cover_letter
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const values = [
                jobId, applicant_name, email, phone,
                resume_url, cover_letter
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get job applications
    getJobApplications: async (req, res) => {
        try {
            const { jobId } = req.params;
            const { status } = req.query;

            let query = `
                SELECT ja.*,
                       jo.title as job_title,
                       jo.department
                FROM job_applications ja
                JOIN job_openings jo ON ja.job_id = jo.id
                WHERE ja.job_id = $1
            `;

            const values = [jobId];
            if (status) {
                query += ` AND ja.status = $2`;
                values.push(status);
            }

            query += ' ORDER BY ja.created_at DESC';

            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Update application status
    updateApplicationStatus: async (req, res) => {
        try {
            const { applicationId } = req.params;
            const { status, interview_date, notes } = req.body;

            const query = `
                UPDATE job_applications
                SET status = $1,
                    interview_date = $2,
                    notes = $3
                WHERE id = $4
                RETURNING *
            `;

            const result = await pool.query(query, [
                status, interview_date, notes, applicationId
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Application not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    },

    // Get recruitment statistics
    getRecruitmentStats: async (req, res) => {
        try {
            const query = `
                SELECT 
                    COUNT(DISTINCT jo.id) as total_openings,
                    COUNT(DISTINCT CASE WHEN jo.status = 'open' THEN jo.id END) as active_openings,
                    COUNT(ja.id) as total_applications,
                    COUNT(CASE WHEN ja.status = 'received' THEN 1 END) as new_applications,
                    COUNT(CASE WHEN ja.status = 'shortlisted' THEN 1 END) as shortlisted,
                    COUNT(CASE WHEN ja.status = 'selected' THEN 1 END) as selected
                FROM job_openings jo
                LEFT JOIN job_applications ja ON jo.id = ja.job_id
            `;

            const result = await pool.query(query);
            res.json(result.rows[0]);
        } catch (error) {
            handleError(res, error);
        }
    }
};

export default recruitmentController; 