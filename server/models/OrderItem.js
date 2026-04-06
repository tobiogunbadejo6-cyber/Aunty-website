const { DataTypes } = require("sequelize");

module.exports = (sequelize) => sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "order_id"
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "product_id"
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    }
  },
  {
    tableName: "order_items",
    underscored: true,
    timestamps: false
  }
);
