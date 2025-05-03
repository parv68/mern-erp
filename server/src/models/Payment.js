const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  fee_structure_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'FeeStructures',
      key: 'id'
    }
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  payment_method: {
    type: DataTypes.ENUM('ONLINE', 'CASH', 'CHEQUE', 'BANK_TRANSFER'),
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING,
    unique: true
  },
  payment_status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  receipt_number: {
    type: DataTypes.STRING,
    unique: true
  },
  remarks: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['student_id']
    },
    {
      fields: ['payment_date']
    },
    {
      fields: ['transaction_id']
    }
  ]
});

module.exports = Payment; 