import { pool } from '../db/connection.js';

/**
 * Middleware to check if the user has one of the allowed roles
 * @param {Array} allowedRoles - Array of role names that are allowed to access the route
 */
export const checkRole = (allowedRoles) => {
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

/**
 * Middleware to check if the user has specific permissions
 * @param {Array} requiredPermissions - Array of permission codes required to access the route
 */
export const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            // Get user permissions from database
            const { rows } = await pool.query(
                `SELECT p.code 
                 FROM permissions p
                 JOIN role_permissions rp ON p.id = rp.permission_id
                 JOIN user_roles ur ON rp.role_id = ur.role_id
                 WHERE ur.user_id = $1`,
                [req.user.id]
            );

            const userPermissions = rows.map(row => row.code);

            // Check if user has all required permissions
            const hasAllPermissions = requiredPermissions.every(
                permission => userPermissions.includes(permission)
            );

            if (!hasAllPermissions) {
                return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};

/**
 * Middleware to check if user is accessing their own resource or has admin privileges
 * @param {Function} getResourceUserId - Function to extract the resource owner ID from the request
 */
export const checkResourceOwnership = (getResourceUserId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            // Admin, HR, and Principal roles can access any resource
            if (['admin', 'hr', 'principal'].includes(req.user.role)) {
                return next();
            }

            const resourceUserId = await getResourceUserId(req);
            
            // If the resource belongs to the user, allow access
            if (resourceUserId === req.user.id) {
                return next();
            }

            // Otherwise, deny access
            return res.status(403).json({ message: 'Access denied: Not the resource owner' });
        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({ message: 'Error checking resource ownership' });
        }
    };
}; 