const express = require("express");

const { getDashboardOverview } = require("../controllers/adminController");
const { updatePaymentSettings } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overview", protect, getDashboardOverview);
router.put("/payment-settings", protect, updatePaymentSettings);

module.exports = router;
