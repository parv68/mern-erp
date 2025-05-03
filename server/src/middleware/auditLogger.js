const { pool } = require('../db');

/**
 * Middleware to log user authentication events
 */
const auditLogger = {
  /**
   * Log a login attempt (successful or failed)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Number} userId - User ID (or null for failed login)
   * @param {Boolean} success - Whether the login was successful
   * @param {String} action - Type of action ('login', 'logout', etc.)
   */
  async logAuthEvent(req, res, userId, success, action = 'login') {
    try {
      await pool.query(
        'INSERT INTO user_login_audit (user_id, ip_address, user_agent, success, action) VALUES ($1, $2, $3, $4, $5)',
        [userId, req.ip, req.headers['user-agent'], success, action]
      );
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't fail the request if audit logging fails
    }
  },

  /**
   * Middleware to log successful authentications
   */
  logAuth(req, res, next) {
    // Store the original end method
    const originalEnd = res.end;

    // Override the end method
    res.end = function(...args) {
      // If this is a successful authentication
      if (res.statusCode === 200 && req.path.includes('/login')) {
        const userId = req.user?.id;
        if (userId) {
          auditLogger.logAuthEvent(req, res, userId, true, 'login');
        }
      }

      // Call the original end method
      originalEnd.apply(res, args);
    };

    next();
  }
};

module.exports = auditLogger; 