const { DataTypes } = require("sequelize");

module.exports = (sequelize) => sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "product_id"
    },
    customerName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "customer_name",
      validate: {
        notEmpty: true
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 2000]
      }
    }
  },
  {
    tableName: "reviews",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false
  }
);
