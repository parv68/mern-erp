import jwt from 'jsonwebtoken';
import { query } from '../db/connection.js';
import { User, Role, Permission } from '../models';

const auth = {
  // Verify JWT token middleware
  authenticateToken: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        include: [{ model: Role, include: [Permission] }]
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },

  // Check if user has required role
  hasRole: (roleName) => {
    return async (req, res, next) => {
      try {
        const userRoles = await req.user.getRoles();
        const hasRole = userRoles.some(role => role.name === roleName);

        if (!hasRole) {
          return res.status(403).json({ error: 'Access denied' });
        }

        next();
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    };
  },

  // Check if user has required permission
  hasPermission: (permissionName) => {
    return async (req, res, next) => {
      try {
        const userRoles = await req.user.getRoles({
          include: [Permission]
        });

        const hasPermission = userRoles.some(role =>
          role.Permissions.some(permission => permission.name === permissionName)
        );

        if (!hasPermission) {
          return res.status(403).json({ error: 'Access denied' });
        }

        next();
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    };
  }
};

export default auth; 