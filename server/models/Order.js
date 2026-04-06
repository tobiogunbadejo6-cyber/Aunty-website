const { DataTypes } = require("sequelize");

module.exports = (sequelize) => sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "customer_name",
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "total_price",
      validate: {
        min: 0
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "discount_amount",
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    shippingFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "shipping_fee",
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    promoCode: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "promo_code"
    },
    paymentMethod: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: "payment_method",
      defaultValue: "BANK_TRANSFER"
    },
    paymentReference: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "payment_reference"
    },
    paymentStatus: {
      type: DataTypes.ENUM("Pending", "Paid", "Verified"),
      allowNull: false,
      field: "payment_status",
      defaultValue: "Pending"
    },
    status: {
      type: DataTypes.ENUM("Pending", "Delivered"),
      allowNull: false,
      defaultValue: "Pending"
    }
  },
  {
    tableName: "orders",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false
  }
);
