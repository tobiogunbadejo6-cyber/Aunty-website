const express = require("express");

const { validatePromoCode } = require("../controllers/promoController");

const router = express.Router();

router.post("/validate", validatePromoCode);

module.exports = router;
