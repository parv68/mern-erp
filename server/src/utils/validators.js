/**
 * Utility functions for validating examination-related data
 */

// Validate exam schedule data
export const validateExamSchedule = (data) => {
    const { exam_type_id, class_id, subject_id, exam_date, start_time, end_time } = data;
    return !!exam_type_id && !!class_id && !!subject_id && !!exam_date && !!start_time && !!end_time;
};

// Validate assessment data
export const validateAssessment = (data) => {
    const { name, exam_type_id, class_id, subject_id, total_marks } = data;
    return !!name && !!exam_type_id && !!class_id && !!subject_id && total_marks > 0;
};

// Validate marks data
export const validateMarks = (data) => {
    const { student_id, assessment_id, marks_obtained } = data;
    return !!student_id && !!assessment_id && marks_obtained >= 0;
};

// Validate attendance data
export const validateAttendance = (data) => {
    const { student_id, class_id, date, status } = data;
    return !!student_id && !!class_id && !!date && ['present', 'absent', 'late', 'excused'].includes(status);
};

// Validate student data
export const validateStudent = (data) => {
    const { first_name, last_name, date_of_birth, class_id } = data;
    return !!first_name && !!last_name && !!date_of_birth && !!class_id;
};

// Validate teacher data
export const validateTeacher = (data) => {
    const { first_name, last_name, email } = data;
    return !!first_name && !!last_name && !!email && /\S+@\S+\.\S+/.test(email);
};

// Validate fee data
export const validateFeeData = (data) => {
    const { student_id, amount, fee_type, due_date } = data;
    return !!student_id && amount > 0 && !!fee_type && !!due_date;
};

// Validate payment data
export const validatePayment = (data) => {
    const { fee_id, amount_paid, payment_method } = data;
    return !!fee_id && amount_paid > 0 && !!payment_method;
};

// Export all validators for use in controllers
export default {
    validateExamSchedule,
    validateAssessment,
    validateMarks,
    validateAttendance,
    validateStudent,
    validateTeacher,
    validateFeeData,
    validatePayment
}; 