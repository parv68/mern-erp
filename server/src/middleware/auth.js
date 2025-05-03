import jwt from 'jsonwebtoken';
import { pool } from '../db/connection.js';

/**
 * Middleware to verify JWT token
 */
const verifyToken = async (req, res, next) => {
    try {
        // Get auth header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided' });
        }

        // Get token from header
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists and is active
        const result = await pool.query(
            'SELECT id, role, username, email FROM users WHERE id = $1 AND is_active = true',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Add user info to request
        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error('Auth error:', error);
        res.status(500).json({ message: 'Authentication error' });
    }
};

// Alias for verifyToken to maintain backward compatibility
const authenticate = verifyToken;
const authenticateToken = verifyToken;

/**
 * Middleware to check if user has one of the allowed roles
 * @param {Array} allowedRoles - Array of role names that are allowed to access the route
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        next();
    };
};

// Alias for checkRole to maintain backward compatibility
const authorizeRoles = checkRole;
const authorize = checkRole;
const hasRole = checkRole;

/**
 * Middleware that allows any authenticated user to proceed
 */
const hasAnyRole = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    next();
};

export { 
    verifyToken, 
    authenticate, 
    authenticateToken,
    checkRole, 
    authorizeRoles,
    authorize,
    hasRole,
    hasAnyRole
}; 