-- Create exam_types table
CREATE TABLE exam_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exam_schedules table
CREATE TABLE exam_schedules (
    id SERIAL PRIMARY KEY,
    exam_type_id INTEGER REFERENCES exam_types(id),
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assessments table
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    exam_type_id INTEGER REFERENCES exam_types(id),
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create student_marks table
CREATE TABLE student_marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    assessment_id INTEGER REFERENCES assessments(id),
    marks_obtained DECIMAL(5,2) NOT NULL,
    remarks TEXT,
    entered_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_marks CHECK (marks_obtained >= 0)
);

-- Create report_cards table
CREATE TABLE report_cards (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    exam_type_id INTEGER REFERENCES exam_types(id),
    total_marks DECIMAL(7,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade VARCHAR(2),
    remarks TEXT,
    generated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_exam_schedules_exam_type ON exam_schedules(exam_type_id);
CREATE INDEX idx_exam_schedules_class ON exam_schedules(class_id);
CREATE INDEX idx_assessments_exam_type ON assessments(exam_type_id);
CREATE INDEX idx_assessments_class ON assessments(class_id);
CREATE INDEX idx_student_marks_student ON student_marks(student_id);
CREATE INDEX idx_student_marks_assessment ON student_marks(assessment_id);
CREATE INDEX idx_report_cards_student ON report_cards(student_id);
CREATE INDEX idx_report_cards_exam_type ON report_cards(exam_type_id); 