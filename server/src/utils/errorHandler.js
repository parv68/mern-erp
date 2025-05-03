/**
 * Centralized error handling for consistency across the application
 * @param {Object} res - Express response object
 * @param {Error} error - The error that occurred
 * @param {string} customMessage - Optional custom message to return
 */
export const handleError = (res, error, customMessage) => {
    console.error('Error occurred:', error);
    
    // Handle specific error types
    if (error.code === '23505') {
        // Unique constraint violation (Postgres)
        return res.status(409).json({ 
            message: customMessage || 'This record already exists' 
        });
    }
    
    if (error.code === '23503') {
        // Foreign key constraint violation (Postgres)
        return res.status(400).json({ 
            message: customMessage || 'Referenced record does not exist' 
        });
    }
    
    if (error.code === '22P02') {
        // Invalid text representation (usually invalid UUID)
        return res.status(400).json({ 
            message: customMessage || 'Invalid identifier provided' 
        });
    }
    
    // Default error response
    const statusCode = error.statusCode || 500;
    const message = customMessage || error.message || 'An unexpected error occurred';
    
    return res.status(statusCode).json({ message });
};

/**
 * Wrap an async controller to handle errors consistently
 * @param {Function} fn - Async controller function to wrap
 * @returns {Function} Wrapped function that handles errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            handleError(res, error);
        });
    };
};

export default {
    handleError,
    asyncHandler
}; 