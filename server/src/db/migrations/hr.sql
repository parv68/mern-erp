-- Staff Records Table
CREATE TABLE staff_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    contract_type VARCHAR(50) CHECK (contract_type IN ('permanent', 'contract', 'probation')),
    contract_end_date DATE,
    salary DECIMAL(10, 2) NOT NULL,
    bank_account VARCHAR(50),
    emergency_contact VARCHAR(100),
    documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Types Table
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    days_allowed INTEGER NOT NULL,
    is_paid BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Applications Table
CREATE TABLE leave_applications (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff_records(id) NOT NULL,
    leave_type_id INTEGER REFERENCES leave_types(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff Attendance Table
CREATE TABLE staff_attendance (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff_records(id) NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'half-day', 'leave')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (staff_id, date)
);

-- Job Openings Table
CREATE TABLE job_openings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    position_count INTEGER DEFAULT 1,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('open', 'closed', 'on-hold')) DEFAULT 'open',
    closing_date DATE,
    created_by INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job Applications Table
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES job_openings(id) NOT NULL,
    applicant_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    resume_url TEXT NOT NULL,
    cover_letter TEXT,
    status VARCHAR(20) CHECK (status IN ('received', 'reviewing', 'shortlisted', 'interviewed', 'selected', 'rejected')) DEFAULT 'received',
    interview_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Table
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff_records(id) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    basic_salary DECIMAL(10, 2) NOT NULL,
    allowances JSONB NOT NULL DEFAULT '{}',
    deductions JSONB NOT NULL DEFAULT '{}',
    net_salary DECIMAL(10, 2) NOT NULL,
    payment_date DATE,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'processed', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (staff_id, month, year)
);

-- Performance Reviews Table
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff_records(id) NOT NULL,
    reviewer_id INTEGER REFERENCES users(id) NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    ratings JSONB NOT NULL,
    comments TEXT,
    goals TEXT,
    status VARCHAR(20) CHECK (status IN ('draft', 'submitted', 'acknowledged')) DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff Documents Table
CREATE TABLE staff_documents (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff_records(id) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_staff_records_user_id ON staff_records(user_id);
CREATE INDEX idx_leave_applications_staff_id ON leave_applications(staff_id);
CREATE INDEX idx_staff_attendance_staff_date ON staff_attendance(staff_id, date);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_payroll_staff_month_year ON payroll(staff_id, month, year);
CREATE INDEX idx_performance_reviews_staff_id ON performance_reviews(staff_id);
CREATE INDEX idx_staff_documents_staff_id ON staff_documents(staff_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_records_updated_at
    BEFORE UPDATE ON staff_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_applications_updated_at
    BEFORE UPDATE ON leave_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_openings_updated_at
    BEFORE UPDATE ON job_openings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
    BEFORE UPDATE ON payroll
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at
    BEFORE UPDATE ON performance_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_documents_updated_at
    BEFORE UPDATE ON staff_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 