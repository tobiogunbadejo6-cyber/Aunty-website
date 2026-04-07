const express = require("express");

const {
  createOrder,
  getOrders,
  exportOrdersCsv,
  trackOrder,
  markOrderDelivered,
  updateOrderPaymentStatus
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createOrder);
router.get("/track", trackOrder);
router.get("/", protect, getOrders);
router.get("/export.csv", protect, exportOrdersCsv);
router.patch("/:id/deliver", protect, markOrderDelivered);
router.patch("/:id/payment-status", protect, updateOrderPaymentStatus);

module.exports = router;
