const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/vnpay/create", paymentController.createVnpayPayment);

router.get("/vnpay_return", paymentController.vnpayReturn);

router.get("/vnpay_ipn", paymentController.vnpayIpn);

module.exports = router;
