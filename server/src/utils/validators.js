const validateExamSchedule = (data) => {
    const { exam_type_id, class_id, subject_id, exam_date, start_time, end_time } = data;
    
    if (!exam_type_id || !class_id || !subject_id || !exam_date || !start_time || !end_time) {
        return false;
    }

    // Validate date and time formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!dateRegex.test(exam_date)) return false;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) return false;

    // Ensure end time is after start time
    const [startHour, startMinute] = start_time.split(':').map(Number);
    const [endHour, endMinute] = end_time.split(':').map(Number);
    
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        return false;
    }

    return true;
};

const validateAssessment = (data) => {
    const {
        name, exam_type_id, class_id, subject_id,
        total_marks, passing_marks
    } = data;

    if (!name || !exam_type_id || !class_id || !subject_id || 
        !total_marks || !passing_marks) {
        return false;
    }

    // Validate marks
    if (isNaN(total_marks) || isNaN(passing_marks)) return false;
    if (total_marks <= 0 || passing_marks <= 0) return false;
    if (passing_marks > total_marks) return false;

    return true;
};

const validateMarks = (data) => {
    const { student_id, assessment_id, marks_obtained } = data;

    if (!student_id || !assessment_id || marks_obtained === undefined) {
        return false;
    }

    // Validate marks
    if (isNaN(marks_obtained)) return false;
    if (marks_obtained < 0) return false;

    return true;
};

module.exports = {
    validateExamSchedule,
    validateAssessment,
    validateMarks
}; 