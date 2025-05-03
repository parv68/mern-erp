import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import { pool } from './db/connection.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import classRoutes from './routes/classes.js';
import subjectRoutes from './routes/subjects.js';
import timetableRoutes from './routes/timetable.js';
import attendanceRoutes from './routes/attendance.js';
import academicRoutes from './routes/academic.js';
import studentRoutes from './routes/student.js';
import libraryRoutes from './routes/library.js';
import examRoutes from './routes/exam.js';
import examinationRoutes from './routes/examinationRoutes.js';
import financeRoutes from './routes/finance.js';
import financialRoutes from './routes/financialRoutes.js';
import communicationRoutes from './routes/communication.js';
import hrRoutes from './routes/hr.js';
import reportsRoutes from './routes/reports.js';
import auditRoutes from './routes/auditRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/examination', examinationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Test database connection
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('Database connection failed:', err);
        } else {
            console.log('Database connected successfully');
        }
    });
}); 