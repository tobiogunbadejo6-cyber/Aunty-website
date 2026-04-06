const express = require("express");

const { createOrder, getOrders, markOrderDelivered, updateOrderPaymentStatus } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createOrder);
router.get("/", protect, getOrders);
router.patch("/:id/deliver", protect, markOrderDelivered);
router.patch("/:id/payment-status", protect, updateOrderPaymentStatus);

module.exports = router;
