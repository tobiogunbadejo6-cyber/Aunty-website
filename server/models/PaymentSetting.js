const { DataTypes } = require("sequelize");

module.exports = (sequelize) => sequelize.define(
  "PaymentSetting",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    businessName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "business_name",
      defaultValue: "KETTYSCENT"
    },
    bankName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "bank_name"
    },
    accountName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "account_name"
    },
    accountNumber: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "account_number"
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    acceptBankTransfer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: "accept_bank_transfer",
      defaultValue: true
    },
    acceptCard: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: "accept_card",
      defaultValue: true
    },
    acceptUssd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: "accept_ussd",
      defaultValue: true
    }
  },
  {
    tableName: "payment_settings",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false
  }
);
