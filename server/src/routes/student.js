import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import {
    getAllStudents,
    getStudentById,
    admitStudent,
    updateStudent,
    deleteStudent,
    getStudentsByClass,
    getStudentPerformance
} from '../controllers/studentController.js';

const router = express.Router();

// Get all students
router.get('/', verifyToken, getAllStudents);

// Get student by ID
router.get('/:id', verifyToken, getStudentById);

// Create new student
router.post('/', verifyToken, checkRole(['admin']), admitStudent);

// Update student
router.put('/:id', verifyToken, checkRole(['admin']), updateStudent);

// Delete student
router.delete('/:id', verifyToken, checkRole(['admin']), deleteStudent);

// Get students by class
router.get('/class/:classId', verifyToken, getStudentsByClass);

// Get student academic performance
router.get('/:id/performance', verifyToken, getStudentPerformance);

export default router; 