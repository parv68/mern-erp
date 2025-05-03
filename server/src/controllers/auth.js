import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const { rows } = await query(
      'SELECT id, email, password, role, first_name, last_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    delete user.password;

    res.json({
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, role, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const { rows } = await query(
      `INSERT INTO users (email, password, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, first_name, last_name`,
      [email, hashedPassword, role, first_name, last_name]
    );

    const user = rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name,
              CASE 
                WHEN u.role = 'teacher' THEN json_build_object(
                  'department', t.department,
                  'qualification', t.qualification,
                  'joining_date', t.joining_date
                )
                WHEN u.role = 'student' THEN json_build_object(
                  'admission_number', s.admission_number,
                  'class_id', s.class_id,
                  'section_id', s.section_id,
                  'roll_number', s.roll_number,
                  'admission_date', s.admission_date
                )
                ELSE NULL
              END as role_details
       FROM users u
       LEFT JOIN teachers t ON u.id = t.user_id AND u.role = 'teacher'
       LEFT JOIN students s ON u.id = s.user_id AND u.role = 'student'
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    const { rows } = await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2
       WHERE id = $3
       RETURNING id, email, role, first_name, last_name`,
      [first_name, last_name, req.user.id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current user
    const { rows } = await query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 