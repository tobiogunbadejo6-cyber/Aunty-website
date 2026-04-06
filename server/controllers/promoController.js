const { PromoCode } = require("../models");

function computeDiscount(subtotal, promo) {
  if (!promo || !promo.isActive) {
    return 0;
  }

  const value = Number(promo.discountValue);
  if (promo.discountType === "PERCENT") {
    return Math.min(subtotal, (subtotal * value) / 100);
  }

  return Math.min(subtotal, value);
}

async function validatePromoCode(req, res) {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Promo code is required." });
    }

    const promo = await PromoCode.findOne({
      where: { code: String(code).trim().toUpperCase(), isActive: true }
    });

    if (!promo) {
      return res.status(404).json({ message: "Promo code is invalid." });
    }

    const parsedSubtotal = Math.max(0, Number(subtotal) || 0);
    const discountAmount = computeDiscount(parsedSubtotal, promo);

    return res.json({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount,
      finalTotal: Math.max(0, parsedSubtotal - discountAmount)
    });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to validate promo code." });
  }
}

module.exports = {
  validatePromoCode,
  computeDiscount
};
