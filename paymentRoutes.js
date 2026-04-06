const express = require("express");

const { getPublicPaymentSettings } = require("../controllers/paymentController");

const router = express.Router();

router.get("/settings", getPublicPaymentSettings);

module.exports = router;
