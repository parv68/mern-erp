import { pool } from '../db/connection.js';

// Get all roles
export const getAllRoles = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT r.*, json_agg(p.*) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id
            ORDER BY r.name
        `);
        
        // Clean up null permissions
        const roles = rows.map(role => {
            if (role.permissions && role.permissions[0] === null) {
                role.permissions = [];
            }
            return role;
        });
        
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Error fetching roles' });
    }
};

// Get role by ID
export const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { rows } = await pool.query(`
            SELECT r.*, json_agg(p.*) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = $1
            GROUP BY r.id
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }
        
        // Clean up null permissions
        if (rows[0].permissions && rows[0].permissions[0] === null) {
            rows[0].permissions = [];
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ message: 'Error fetching role' });
    }
};

// Create a new role
export const createRole = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { name, description, permissions } = req.body;
        
        // Insert the role
        const { rows } = await client.query(
            `INSERT INTO roles (name, description) 
             VALUES ($1, $2) 
             RETURNING id, name, description`,
            [name, description]
        );
        
        const roleId = rows[0].id;
        
        // Add permissions if provided
        if (permissions && permissions.length > 0) {
            const permissionValues = permissions.map((permId, index) => {
                return `($1, $${index + 2})`;
            }).join(', ');
            
            const permissionParams = [roleId, ...permissions];
            
            await client.query(
                `INSERT INTO role_permissions (role_id, permission_id) 
                 VALUES ${permissionValues}`,
                permissionParams
            );
        }
        
        // Get the complete role with permissions
        const result = await client.query(`
            SELECT r.*, json_agg(p.*) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = $1
            GROUP BY r.id
        `, [roleId]);
        
        await client.query('COMMIT');
        
        // Clean up null permissions
        if (result.rows[0].permissions && result.rows[0].permissions[0] === null) {
            result.rows[0].permissions = [];
        }
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating role:', error);
        res.status(500).json({ message: 'Error creating role' });
    } finally {
        client.release();
    }
};

// Update a role
export const updateRole = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const { name, description, permissions } = req.body;
        
        // Update the role
        const { rows } = await client.query(
            `UPDATE roles 
             SET name = $1, description = $2
             WHERE id = $3
             RETURNING id`,
            [name, description, id]
        );
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Role not found' });
        }
        
        // Update permissions if provided
        if (permissions) {
            // Delete existing role permissions
            await client.query(
                'DELETE FROM role_permissions WHERE role_id = $1',
                [id]
            );
            
            // Add new permissions
            if (permissions.length > 0) {
                const permissionValues = permissions.map((permId, index) => {
                    return `($1, $${index + 2})`;
                }).join(', ');
                
                const permissionParams = [id, ...permissions];
                
                await client.query(
                    `INSERT INTO role_permissions (role_id, permission_id) 
                     VALUES ${permissionValues}`,
                    permissionParams
                );
            }
        }
        
        // Get the updated role with permissions
        const result = await client.query(`
            SELECT r.*, json_agg(p.*) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = $1
            GROUP BY r.id
        `, [id]);
        
        await client.query('COMMIT');
        
        // Clean up null permissions
        if (result.rows[0].permissions && result.rows[0].permissions[0] === null) {
            result.rows[0].permissions = [];
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Error updating role' });
    } finally {
        client.release();
    }
};

// Delete a role
export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if role exists
        const roleCheck = await pool.query(
            'SELECT id FROM roles WHERE id = $1',
            [id]
        );
        
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }
        
        // Delete the role (cascades to role_permissions)
        await pool.query(
            'DELETE FROM roles WHERE id = $1',
            [id]
        );
        
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ message: 'Error deleting role' });
    }
};

// Get all permissions
export const getAllPermissions = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM permissions ORDER BY name'
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'Error fetching permissions' });
    }
};

// Create a new permission
export const createPermission = async (req, res) => {
    try {
        const { name, code, description } = req.body;
        
        const { rows } = await pool.query(
            `INSERT INTO permissions (name, code, description) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [name, code, description]
        );
        
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating permission:', error);
        res.status(500).json({ message: 'Error creating permission' });
    }
};

// Assign role to user
export const assignRoleToUser = async (req, res) => {
    try {
        const { user_id, role_id } = req.body;
        
        // Check if the assignment already exists
        const existingCheck = await pool.query(
            'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
            [user_id, role_id]
        );
        
        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already has this role' });
        }
        
        // Create the assignment
        await pool.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [user_id, role_id]
        );
        
        res.status(201).json({ message: 'Role assigned successfully' });
    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ message: 'Error assigning role' });
    }
};

// Remove role from user
export const removeRoleFromUser = async (req, res) => {
    try {
        const { userId, roleId } = req.params;
        
        await pool.query(
            'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
            [userId, roleId]
        );
        
        res.json({ message: 'Role removed successfully' });
    } catch (error) {
        console.error('Error removing role:', error);
        res.status(500).json({ message: 'Error removing role' });
    }
};

export default {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getAllPermissions,
    createPermission,
    assignRoleToUser,
    removeRoleFromUser
}; 