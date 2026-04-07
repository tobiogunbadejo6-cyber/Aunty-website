const express = require("express");

const {
  validatePromoCode,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode
} = require("../controllers/promoController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/validate", validatePromoCode);
router.get("/", protect, getPromoCodes);
router.post("/", protect, createPromoCode);
router.put("/:id", protect, updatePromoCode);
router.delete("/:id", protect, deletePromoCode);

module.exports = router;
