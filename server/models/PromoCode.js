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
    },
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "max_uses",
      validate: {
        min: 1
      }
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "usage_count",
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "expires_at"
    }
  },
  {
    tableName: "promo_codes",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false
  }
);
