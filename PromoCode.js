const { DataTypes } = require("sequelize");

module.exports = (sequelize) => sequelize.define(
  "PromoCode",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    discountType: {
      type: DataTypes.ENUM("PERCENT", "FLAT"),
      allowNull: false,
      field: "discount_type",
      defaultValue: "PERCENT"
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "discount_value",
      validate: {
        min: 0
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: "is_active",
      defaultValue: true
    }
  },
  {
    tableName: "promo_codes",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false
  }
);
