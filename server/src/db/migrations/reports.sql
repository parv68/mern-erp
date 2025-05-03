-- Reports and Analytics Tables

-- Report Templates
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- academic, attendance, financial, etc.
    role VARCHAR(50) NOT NULL, -- admin, teacher, student, parent
    template_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated Reports
CREATE TABLE generated_reports (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES report_templates(id),
    user_id INTEGER NOT NULL,
    report_data JSONB NOT NULL,
    parameters JSONB,
    format VARCHAR(10), -- pdf, xlsx, etc.
    status VARCHAR(20) DEFAULT 'completed',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    file_path VARCHAR(255)
);

-- Report Metrics
CREATE TABLE report_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Access Log
CREATE TABLE report_access_log (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES generated_reports(id),
    user_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- view, download, etc.
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Report Schedules
CREATE TABLE report_schedules (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES report_templates(id),
    user_id INTEGER NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly, etc.
    parameters JSONB,
    recipients JSONB,
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Categories
CREATE TABLE report_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES report_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Permissions
CREATE TABLE report_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    template_id INTEGER REFERENCES report_templates(id),
    can_view BOOLEAN DEFAULT false,
    can_generate BOOLEAN DEFAULT false,
    can_schedule BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_generated_reports_user_id ON generated_reports(user_id);
CREATE INDEX idx_report_metrics_category ON report_metrics(category);
CREATE INDEX idx_report_access_log_report_id ON report_access_log(report_id);
CREATE INDEX idx_report_schedules_template_id ON report_schedules(template_id);
CREATE INDEX idx_report_permissions_role ON report_permissions(role);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 