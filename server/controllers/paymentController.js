const { PaymentSetting } = require("../models");

function serializePaymentSetting(setting) {
  if (!setting) {
    return null;
  }

  const row = typeof setting.get === "function" ? setting.get({ plain: true }) : setting;
  return {
    businessName: row.businessName,
    bankName: row.bankName,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
    instructions: row.instructions,
    freeDeliveryThreshold: Math.max(0, Number(process.env.FREE_DELIVERY_THRESHOLD || 50000)),
    deliveryFee: Math.max(0, Number(process.env.DELIVERY_FEE || 2500)),
    deliveryZones: (() => {
      try {
        const parsed = JSON.parse(process.env.DELIVERY_ZONES_JSON || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        return [];
      }
    })(),
    acceptBankTransfer: true,
    acceptCard: false,
    acceptUssd: false
  };
}

async function getOrCreatePaymentSetting() {
  let setting = await PaymentSetting.findOne({ order: [["id", "ASC"]] });
  if (!setting) {
    setting = await PaymentSetting.create({});
  }
  return setting;
}

async function getPublicPaymentSettings(_req, res) {
  try {
    const setting = await getOrCreatePaymentSetting();
    return res.json(serializePaymentSetting(setting));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to fetch payment settings." });
  }
}

async function updatePaymentSettings(req, res) {
  try {
    const setting = await getOrCreatePaymentSetting();
    await setting.update({
      businessName: req.body.businessName || "KETTYSCENT",
      bankName: req.body.bankName || null,
      accountName: req.body.accountName || null,
      accountNumber: req.body.accountNumber || null,
      instructions: req.body.instructions || null,
      acceptBankTransfer: true,
      acceptCard: false,
      acceptUssd: false
    });

    return res.json(serializePaymentSetting(setting));
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to update payment settings." });
  }
}

module.exports = {
  getPublicPaymentSettings,
  updatePaymentSettings
};
