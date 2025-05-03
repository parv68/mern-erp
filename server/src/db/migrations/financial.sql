-- Fee Structure Table
CREATE TABLE fee_structures (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    fee_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- monthly, quarterly, annually
    academic_year VARCHAR(9) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Payments Table
CREATE TABLE student_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    fee_structure_id INTEGER REFERENCES fee_structures(id),
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL, -- pending, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Salary Structure Table
CREATE TABLE salary_structures (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    basic_salary DECIMAL(10,2) NOT NULL,
    allowances JSONB,
    deductions JSONB,
    effective_from DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salary Payments Table
CREATE TABLE salary_payments (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    salary_structure_id INTEGER REFERENCES salary_structures(id),
    payment_month DATE NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- pending, processed, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reimbursements Table
CREATE TABLE reimbursements (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    receipt_url VARCHAR(255),
    status VARCHAR(20) NOT NULL, -- pending, approved, rejected
    approved_by INTEGER REFERENCES staff(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_student_payments_student_id ON student_payments(student_id);
CREATE INDEX idx_salary_payments_staff_id ON salary_payments(staff_id);
CREATE INDEX idx_reimbursements_staff_id ON reimbursements(staff_id);
CREATE INDEX idx_fee_structures_class_id ON fee_structures(class_id); 