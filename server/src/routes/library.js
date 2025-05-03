import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all books
router.get('/books', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM books 
             ORDER BY title`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get book by ID
router.get('/books/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT b.*, c.name as category_name,
                    COALESCE(
                        (SELECT COUNT(*) FROM book_copies 
                         WHERE book_id = b.id AND status = 'available'),
                        0
                    ) as available_copies
             FROM books b
             LEFT JOIN book_categories c ON b.category_id = c.id
             WHERE b.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new book
router.post('/books', verifyToken, checkRole(['admin', 'librarian']), async (req, res) => {
    try {
        const {
            title,
            author,
            isbn,
            publisher,
            category_id,
            publication_year,
            copies,
            description
        } = req.body;

        const result = await pool.query(
            `INSERT INTO books (
                title, author, isbn, publisher, category_id,
                publication_year, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id`,
            [title, author, isbn, publisher, category_id, publication_year, description]
        );

        const bookId = result.rows[0].id;

        // Add book copies
        for (let i = 0; i < copies; i++) {
            await pool.query(
                `INSERT INTO book_copies (book_id, status)
                 VALUES ($1, 'available')`,
                [bookId]
            );
        }

        res.status(201).json({ message: 'Book added successfully', book_id: bookId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Issue book
router.post('/issue', verifyToken, checkRole(['admin', 'librarian']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { student_id, book_id, due_date } = req.body;

        await client.query('BEGIN');

        // Check if book is available
        const availableCopy = await client.query(
            `SELECT id FROM book_copies 
             WHERE book_id = $1 AND status = 'available' 
             LIMIT 1`,
            [book_id]
        );

        if (availableCopy.rows.length === 0) {
            throw new Error('No copies available');
        }

        const copyId = availableCopy.rows[0].id;

        // Update book copy status
        await client.query(
            `UPDATE book_copies 
             SET status = 'issued' 
             WHERE id = $1`,
            [copyId]
        );

        // Create issue record
        await client.query(
            `INSERT INTO book_issues (
                student_id, book_copy_id, issue_date, due_date, issued_by
            ) VALUES ($1, $2, CURRENT_DATE, $3, $4)`,
            [student_id, copyId, due_date, req.user.id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Book issued successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Return book
router.post('/return', verifyToken, checkRole(['admin', 'librarian']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { issue_id, condition_notes } = req.body;

        await client.query('BEGIN');

        // Get issue details
        const issueResult = await client.query(
            `SELECT bi.*, bc.id as copy_id 
             FROM book_issues bi
             JOIN book_copies bc ON bi.book_copy_id = bc.id
             WHERE bi.id = $1`,
            [issue_id]
        );

        if (issueResult.rows.length === 0) {
            throw new Error('Issue record not found');
        }

        // Update book copy status
        await client.query(
            `UPDATE book_copies 
             SET status = 'available' 
             WHERE id = $1`,
            [issueResult.rows[0].copy_id]
        );

        // Update issue record
        await client.query(
            `UPDATE book_issues 
             SET return_date = CURRENT_DATE,
                 condition_notes = $1,
                 returned_to = $2
             WHERE id = $3`,
            [condition_notes, req.user.id, issue_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Book returned successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get student's current issues
router.get('/student/:id/issues', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT bi.*, b.title, b.author,
                    u1.name as issued_by_name,
                    u2.name as returned_to_name
             FROM book_issues bi
             JOIN book_copies bc ON bi.book_copy_id = bc.id
             JOIN books b ON bc.book_id = b.id
             LEFT JOIN users u1 ON bi.issued_by = u1.id
             LEFT JOIN users u2 ON bi.returned_to = u2.id
             WHERE bi.student_id = $1
             ORDER BY bi.issue_date DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 