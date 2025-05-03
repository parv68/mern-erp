const { Role, Permission } = require('../models');
const { Op } = require('sequelize');

const roleController = {
  // Get all roles
  async getAll(req, res) {
    try {
      const roles = await Role.findAll({
        include: [Permission],
      });
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get role by ID
  async getById(req, res) {
    try {
      const role = await Role.findByPk(req.params.id, {
        include: [Permission],
      });
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create a new role
  async create(req, res) {
    try {
      const { name, description, permissions } = req.body;
      
      const role = await Role.create({
        name,
        description
      });

      if (permissions && permissions.length > 0) {
        const rolePermissions = await Permission.findAll({
          where: { id: { [Op.in]: permissions } }
        });
        await role.setPermissions(rolePermissions);
      }

      const newRole = await Role.findByPk(role.id, {
        include: [Permission],
      });

      res.status(201).json(newRole);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update a role
  async update(req, res) {
    try {
      const { name, description, permissions } = req.body;
      const role = await Role.findByPk(req.params.id);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      await role.update({
        name,
        description
      });

      if (permissions) {
        const rolePermissions = await Permission.findAll({
          where: { id: { [Op.in]: permissions } }
        });
        await role.setPermissions(rolePermissions);
      }

      const updatedRole = await Role.findByPk(role.id, {
        include: [Permission],
      });

      res.json(updatedRole);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete a role
  async delete(req, res) {
    try {
      const role = await Role.findByPk(req.params.id);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      await role.destroy();
      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all permissions
  async getAllPermissions(req, res) {
    try {
      const permissions = await Permission.findAll();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = roleController; 