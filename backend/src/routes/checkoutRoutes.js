const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { optionalAuth } = require("../../middlewares/auth");

router.post("/", optionalAuth, checkoutController.checkout);
router.get("/info", optionalAuth, checkoutController.getCheckoutInfo);

module.exports = router;