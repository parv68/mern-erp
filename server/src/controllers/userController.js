import { User, Role, Permission } from '../models';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { pool } from '../db';
import auditLogger from '../middleware/auditLogger';

const userController = {
  // Create a new user
  async create(req, res) {
    try {
      const { username, email, password, first_name, last_name, roles } = req.body;
      
      const user = await User.create({
        username,
        email,
        password_hash: password,
        first_name,
        last_name
      });

      if (roles && roles.length > 0) {
        const userRoles = await Role.findAll({
          where: { name: { [Op.in]: roles } }
        });
        await user.setRoles(userRoles);
      }

      res.status(201).json(user.toPublicJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get all users
  async getAll(req, res) {
    try {
      const users = await User.findAll({
        include: [{ model: Role, include: [Permission] }],
        attributes: { exclude: ['password_hash'] }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get user by ID
  async getById(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [{ model: Role, include: [Permission] }],
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update user
  async update(req, res) {
    try {
      const { username, email, first_name, last_name, roles } = req.body;
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({
        username,
        email,
        first_name,
        last_name
      });

      if (roles && roles.length > 0) {
        const userRoles = await Role.findAll({
          where: { name: { [Op.in]: roles } }
        });
        await user.setRoles(userRoles);
      }

      res.json(user.toPublicJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete user
  async delete(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({
        where: { 
          [Op.or]: [{ username }, { email: username }]
        },
        include: [{ model: Role, include: [Permission] }]
      });

      if (!user || !(await user.validatePassword(password))) {
        // Log failed login attempt
        if (user) {
          await auditLogger.logAuthEvent(req, res, user.id, false, 'login');
        } else {
          await auditLogger.logAuthEvent(req, res, null, false, 'login');
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful login
      await auditLogger.logAuthEvent(req, res, user.id, true, 'login');

      res.json({
        token,
        user: user.toPublicJSON()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Role, include: [Permission] }],
        attributes: { exclude: ['password_hash'] }
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update profile
  async updateProfile(req, res) {
    try {
      const { first_name, last_name, email } = req.body;
      const user = await User.findByPk(req.user.id);

      await user.update({
        first_name,
        last_name,
        email
      });

      const updatedUser = await User.findByPk(user.id, {
        include: [{ model: Role, include: [Permission] }],
        attributes: { exclude: ['password_hash'] }
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);

      const isValid = await user.validatePassword(currentPassword);
      if (!isValid) {
        // Log failed password change
        await auditLogger.logAuthEvent(req, res, user.id, false, 'password_change');
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      await user.update({ password_hash: newPassword });
      
      // Log successful password change
      await auditLogger.logAuthEvent(req, res, user.id, true, 'password_change');
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Reset password (admin only)
  async resetPassword(req, res) {
    try {
      const { userId, newPassword } = req.body;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({ password_hash: newPassword });
      
      // Log the password reset action
      await auditLogger.logAuthEvent(req, res, userId, true, 'password_reset');
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default userController; 