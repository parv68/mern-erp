-- Books Table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    publication_year INTEGER,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(100),
    description TEXT,
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    shelf_location VARCHAR(50),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Copies Table (for tracking individual copies)
CREATE TABLE book_copies (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id),
    copy_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL, -- available, issued, damaged, lost
    condition VARCHAR(20), -- new, good, fair, poor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, copy_number)
);

-- Library Memberships Table
CREATE TABLE library_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- References users/students/staff
    user_type VARCHAR(20) NOT NULL, -- student, teacher
    membership_number VARCHAR(50) UNIQUE NOT NULL,
    max_books_allowed INTEGER NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- active, expired, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Issues Table
CREATE TABLE book_issues (
    id SERIAL PRIMARY KEY,
    book_copy_id INTEGER REFERENCES book_copies(id),
    membership_id INTEGER REFERENCES library_memberships(id),
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    returned_at TIMESTAMP,
    fine_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL, -- issued, returned, overdue
    issued_by INTEGER NOT NULL, -- librarian who issued
    returned_to INTEGER, -- librarian who received
    notes TEXT
);

-- Book Reservations Table
CREATE TABLE book_reservations (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id),
    membership_id INTEGER REFERENCES library_memberships(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- pending, approved, rejected, cancelled
    valid_until DATE NOT NULL,
    notes TEXT
);

-- Book Categories Table
CREATE TABLE book_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_book_issues_membership_id ON book_issues(membership_id);
CREATE INDEX idx_book_issues_status ON book_issues(status);
CREATE INDEX idx_book_reservations_membership_id ON book_reservations(membership_id);
CREATE INDEX idx_book_reservations_status ON book_reservations(status);
CREATE INDEX idx_library_memberships_user_id ON library_memberships(user_id);
CREATE INDEX idx_library_memberships_status ON library_memberships(status);

-- Create function to update books.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON library_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 