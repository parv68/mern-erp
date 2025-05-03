-- HR Module Schema

-- Staff Table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    position VARCHAR(100),
    department VARCHAR(100),
    joining_date DATE,
    salary DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_id INTEGER REFERENCES staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Positions Table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    description TEXT,
    salary_range_min DECIMAL(10, 2),
    salary_range_max DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff Documents Table
CREATE TABLE staff_documents (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Types Table
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    days_allowed INTEGER NOT NULL DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Applications Table
CREATE TABLE leave_applications (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    leave_type_id INTEGER REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    admin_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Balances Table
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    leave_type_id INTEGER REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    days_allowed INTEGER NOT NULL,
    days_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, leave_type_id, year)
);

-- Payroll Table
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(10, 2) NOT NULL,
    allowances DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, month, year)
);

-- Performance Reviews Table
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    review_period VARCHAR(100) NOT NULL,
    review_date DATE NOT NULL,
    reviewer_id INTEGER REFERENCES users(id),
    performance_areas JSONB,
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    overall_comments TEXT,
    overall_rating DECIMAL(3, 1) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    employee_comments TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Table
CREATE TABLE staff_attendance (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'present',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, date)
);

-- Recruitment Table
CREATE TABLE recruitment (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES positions(id),
    job_title VARCHAR(100) NOT NULL,
    job_description TEXT,
    requirements TEXT,
    posting_date DATE,
    closing_date DATE,
    status VARCHAR(50) DEFAULT 'open',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Applicants Table
CREATE TABLE applicants (
    id SERIAL PRIMARY KEY,
    recruitment_id INTEGER REFERENCES recruitment(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_path VARCHAR(255),
    cover_letter_path VARCHAR(255),
    application_date DATE,
    status VARCHAR(50) DEFAULT 'applied',
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interview Schedules Table
CREATE TABLE interview_schedules (
    id SERIAL PRIMARY KEY,
    applicant_id INTEGER REFERENCES applicants(id) ON DELETE CASCADE,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    interviewers INTEGER[] NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    feedback TEXT,
    rating INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Training Programs Table
CREATE TABLE training_programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trainer VARCHAR(255),
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    budget DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'upcoming',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Training Participants Table
CREATE TABLE training_participants (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES training_programs(id) ON DELETE CASCADE,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'enrolled',
    completion_status VARCHAR(50),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, staff_id)
);

-- Sample Data Insertion: Default Leave Types

INSERT INTO leave_types (name, description, days_allowed, is_paid) 
VALUES 
('Annual', 'Regular annual leave', 20, TRUE),
('Sick', 'Medical leave', 12, TRUE),
('Casual', 'Short term casual leave', 10, TRUE),
('Maternity', 'Maternity leave', 90, TRUE),
('Paternity', 'Paternity leave', 14, TRUE),
('Unpaid', 'Leave without pay', 30, FALSE),
('Study', 'Education or certification related leave', 15, TRUE);

-- Sample Data Insertion: Departments

INSERT INTO departments (name, description)
VALUES
('Academic', 'Teaching and academic department'),
('Administration', 'Administrative functions and school operations'),
('Finance', 'Budget and financial operations'),
('Human Resources', 'Personnel management and development'),
('IT Support', 'Technical support and infrastructure management'),
('Student Affairs', 'Student support services and activities');

-- Indexes for performance optimization

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_leave_applications_staff_id ON leave_applications(staff_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX idx_payroll_year_month ON payroll(year, month);
CREATE INDEX idx_performance_reviews_staff_id ON performance_reviews(staff_id);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(date);
CREATE INDEX idx_staff_attendance_staff_id_date ON staff_attendance(staff_id, date);
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_training_programs_status ON training_programs(status); 