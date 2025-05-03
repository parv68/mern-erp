import { pool } from '../db/connection.js';

export const generateAdmissionNumber = async () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Get the latest admission number for the current year
    const result = await pool.query(
        "SELECT admission_number FROM students WHERE admission_number LIKE $1 ORDER BY admission_number DESC LIMIT 1",
        [`${currentYear}%`]
    );
    
    let sequence = '0001';
    if (result.rows.length > 0) {
        const lastNumber = result.rows[0].admission_number;
        const lastSequence = parseInt(lastNumber.slice(-4));
        sequence = (lastSequence + 1).toString().padStart(4, '0');
    }
    
    return `${currentYear}${sequence}`;
}; 