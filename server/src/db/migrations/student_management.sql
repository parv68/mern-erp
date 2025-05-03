-- Student Records Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    admission_date DATE NOT NULL,
    class_id INTEGER REFERENCES classes(id),
    section VARCHAR(10),
    parent_name VARCHAR(100) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(100),
    address TEXT NOT NULL,
    blood_group VARCHAR(5),
    previous_school TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, transferred, withdrawn
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic Remarks Table
CREATE TABLE academic_remarks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    teacher_id INTEGER REFERENCES users(id),
    subject_id INTEGER REFERENCES subjects(id),
    remark TEXT NOT NULL,
    remark_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Attendance Table
CREATE TABLE student_attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- present, absent, late, excused
    marked_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Applications Table
CREATE TABLE leave_applications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    applied_by INTEGER REFERENCES users(id), -- parent/student user id
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_student_admission_number ON students(admission_number);
CREATE INDEX idx_student_class ON students(class_id);
CREATE INDEX idx_attendance_date ON student_attendance(date);
CREATE INDEX idx_attendance_student ON student_attendance(student_id);
CREATE INDEX idx_leave_student ON leave_applications(student_id);
CREATE INDEX idx_leave_status ON leave_applications(status); 