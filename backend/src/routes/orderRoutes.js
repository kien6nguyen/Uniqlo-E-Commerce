const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authRequired, adminOnly } = require("../../middlewares/auth");

router.post("/", orderController.createOrder);
router.get("/", authRequired, orderController.getUserOrders);
router.get("/:id", authRequired, orderController.getOrderById);
router.get("/:id/tracking", authRequired, orderController.trackOrderStatus);
router.patch("/:id/payment", authRequired, orderController.updatePaymentStatus);
router.delete("/:id", authRequired, orderController.cancelOrder);
router.get("/guest/:id", orderController.getOrderByIdForGuest);

module.exports = router;
