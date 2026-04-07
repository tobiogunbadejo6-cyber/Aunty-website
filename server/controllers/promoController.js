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

function serializePromo(promo) {
  const data = typeof promo.get === "function" ? promo.get({ plain: true }) : promo;
  return {
    _id: String(data.id),
    id: data.id,
    code: data.code,
    discountType: data.discountType,
    discountValue: Number(data.discountValue),
    isActive: Boolean(data.isActive),
    createdAt: data.created_at || data.createdAt || null
  };
}

async function getPromoCodes(_req, res) {
  try {
    const promos = await PromoCode.findAll({
      order: [["created_at", "DESC"]]
    });
    return res.json(promos.map(serializePromo));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to fetch promo codes." });
  }
}

async function createPromoCode(req, res) {
  try {
    const { code, discountType, discountValue, isActive } = req.body;
    const normalizedCode = String(code || "").trim().toUpperCase();
    const normalizedType = String(discountType || "").trim().toUpperCase();
    const value = Number(discountValue);

    if (!normalizedCode) {
      return res.status(400).json({ message: "Promo code is required." });
    }
    if (!["PERCENT", "FLAT"].includes(normalizedType)) {
      return res.status(400).json({ message: "Discount type must be PERCENT or FLAT." });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: "Discount value must be greater than 0." });
    }
    if (normalizedType === "PERCENT" && value > 100) {
      return res.status(400).json({ message: "Percent discount cannot be above 100." });
    }

    const existing = await PromoCode.findOne({ where: { code: normalizedCode } });
    if (existing) {
      return res.status(409).json({ message: "Promo code already exists." });
    }

    const promo = await PromoCode.create({
      code: normalizedCode,
      discountType: normalizedType,
      discountValue: value,
      isActive: typeof isActive === "boolean" ? isActive : true
    });

    return res.status(201).json(serializePromo(promo));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to create promo code." });
  }
}

async function updatePromoCode(req, res) {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    const updates = {};
    if (req.body.discountType !== undefined) {
      const normalizedType = String(req.body.discountType || "").trim().toUpperCase();
      if (!["PERCENT", "FLAT"].includes(normalizedType)) {
        return res.status(400).json({ message: "Discount type must be PERCENT or FLAT." });
      }
      updates.discountType = normalizedType;
    }

    if (req.body.discountValue !== undefined) {
      const value = Number(req.body.discountValue);
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({ message: "Discount value must be greater than 0." });
      }
      const typeToValidate = updates.discountType || promo.discountType;
      if (typeToValidate === "PERCENT" && value > 100) {
        return res.status(400).json({ message: "Percent discount cannot be above 100." });
      }
      updates.discountValue = value;
    }

    if (req.body.isActive !== undefined) {
      updates.isActive = Boolean(req.body.isActive);
    }

    await promo.update(updates);
    return res.json(serializePromo(promo));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to update promo code." });
  }
}

async function deletePromoCode(req, res) {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    await promo.destroy();
    return res.json({ message: "Promo code deleted." });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to delete promo code." });
  }
}

module.exports = {
  validatePromoCode,
  computeDiscount,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode
};
