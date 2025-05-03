const pool = require('../config/database');
const { validateBook, validateIssue } = require('../utils/validators');

// Book Management Controllers
exports.addBook = async (req, res) => {
    try {
        const {
            isbn, title, author, publisher, publication_year,
            category, subject, description, total_copies, shelf_location
        } = req.body;

        const validation = validateBook(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert book
            const bookResult = await client.query(
                `INSERT INTO books (isbn, title, author, publisher, publication_year, 
                    category, subject, description, total_copies, available_copies, shelf_location)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10) RETURNING *`,
                [isbn, title, author, publisher, publication_year, category, subject, 
                    description, total_copies, shelf_location]
            );

            // Create book copies
            for (let i = 1; i <= total_copies; i++) {
                await client.query(
                    'INSERT INTO book_copies (book_id, copy_number, status, condition) VALUES ($1, $2, $3, $4)',
                    [bookResult.rows[0].id, i, 'available', 'new']
                );
            }

            await client.query('COMMIT');
            res.status(201).json(bookResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to add book' });
    }
};

exports.searchBooks = async (req, res) => {
    try {
        const { query, category, available_only } = req.query;
        let sqlQuery = 'SELECT * FROM books WHERE 1=1';
        const params = [];

        if (query) {
            params.push(`%${query}%`);
            sqlQuery += ` AND (title ILIKE $${params.length} OR author ILIKE $${params.length} OR isbn LIKE $${params.length})`;
        }

        if (category) {
            params.push(category);
            sqlQuery += ` AND category = $${params.length}`;
        }

        if (available_only === 'true') {
            sqlQuery += ' AND available_copies > 0';
        }

        const result = await pool.query(sqlQuery, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search books' });
    }
};

// Book Issue Controllers
exports.issueBook = async (req, res) => {
    try {
        const { book_id, membership_id, due_date } = req.body;
        const issued_by = req.user.id; // From auth middleware

        const validation = validateIssue(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check book availability
            const bookResult = await client.query(
                'SELECT * FROM books WHERE id = $1 AND available_copies > 0',
                [book_id]
            );

            if (bookResult.rows.length === 0) {
                throw new Error('Book not available');
            }

            // Get available copy
            const copyResult = await client.query(
                'SELECT * FROM book_copies WHERE book_id = $1 AND status = $2 LIMIT 1',
                [book_id, 'available']
            );

            if (copyResult.rows.length === 0) {
                throw new Error('No copies available');
            }

            // Create issue record
            const issueResult = await client.query(
                `INSERT INTO book_issues (book_copy_id, membership_id, due_date, status, issued_by)
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [copyResult.rows[0].id, membership_id, due_date, 'issued', issued_by]
            );

            // Update book copy status
            await client.query(
                'UPDATE book_copies SET status = $1 WHERE id = $2',
                ['issued', copyResult.rows[0].id]
            );

            // Update available copies count
            await client.query(
                'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
                [book_id]
            );

            await client.query('COMMIT');
            res.status(201).json(issueResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to issue book' });
    }
};

exports.returnBook = async (req, res) => {
    try {
        const { issue_id } = req.params;
        const { fine_amount = 0, condition } = req.body;
        const returned_to = req.user.id; // From auth middleware

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get issue details
            const issueResult = await client.query(
                'SELECT * FROM book_issues WHERE id = $1',
                [issue_id]
            );

            if (issueResult.rows.length === 0) {
                throw new Error('Issue record not found');
            }

            const issue = issueResult.rows[0];
            if (issue.status === 'returned') {
                throw new Error('Book already returned');
            }

            // Update issue record
            await client.query(
                `UPDATE book_issues 
                SET status = $1, returned_at = CURRENT_TIMESTAMP, 
                    returned_to = $2, fine_amount = $3
                WHERE id = $4`,
                ['returned', returned_to, fine_amount, issue_id]
            );

            // Update book copy status and condition
            await client.query(
                'UPDATE book_copies SET status = $1, condition = $2 WHERE id = $3',
                ['available', condition, issue.book_copy_id]
            );

            // Update available copies count
            await client.query(
                `UPDATE books SET available_copies = available_copies + 1 
                WHERE id = (SELECT book_id FROM book_copies WHERE id = $1)`,
                [issue.book_copy_id]
            );

            await client.query('COMMIT');
            res.json({ message: 'Book returned successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to return book' });
    }
};

// Reservation Controllers
exports.reserveBook = async (req, res) => {
    try {
        const { book_id, membership_id, valid_until, notes } = req.body;

        // Check if book is already reserved by the same member
        const existingReservation = await pool.query(
            'SELECT * FROM book_reservations WHERE book_id = $1 AND membership_id = $2 AND status = $3',
            [book_id, membership_id, 'pending']
        );

        if (existingReservation.rows.length > 0) {
            return res.status(400).json({ error: 'Book already reserved' });
        }

        const result = await pool.query(
            `INSERT INTO book_reservations (book_id, membership_id, valid_until, status, notes)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [book_id, membership_id, valid_until, 'pending', notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reserve book' });
    }
};

// Report Controllers
exports.generateReport = async (req, res) => {
    try {
        const { report_type, start_date, end_date } = req.query;
        let result;

        switch (report_type) {
            case 'issues':
                result = await pool.query(
                    `SELECT COUNT(*) as total_issues, 
                            COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_issues,
                            SUM(fine_amount) as total_fines
                    FROM book_issues 
                    WHERE issued_at BETWEEN $1 AND $2`,
                    [start_date, end_date]
                );
                break;

            case 'popular_books':
                result = await pool.query(
                    `SELECT b.title, b.author, COUNT(*) as issue_count
                    FROM book_issues bi
                    JOIN book_copies bc ON bi.book_copy_id = bc.id
                    JOIN books b ON bc.book_id = b.id
                    WHERE bi.issued_at BETWEEN $1 AND $2
                    GROUP BY b.id, b.title, b.author
                    ORDER BY issue_count DESC
                    LIMIT 10`,
                    [start_date, end_date]
                );
                break;

            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

// Membership Controllers
exports.createMembership = async (req, res) => {
    try {
        const {
            user_id, user_type, membership_number,
            max_books_allowed, valid_from, valid_until
        } = req.body;

        const result = await pool.query(
            `INSERT INTO library_memberships 
            (user_id, user_type, membership_number, max_books_allowed, valid_from, valid_until, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [user_id, user_type, membership_number, max_books_allowed, valid_from, valid_until, 'active']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create membership' });
    }
}; 