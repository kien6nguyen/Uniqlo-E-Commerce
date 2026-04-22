const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const discountController = require("../controllers/discountController");
const productController = require("../controllers/productController");
const { authRequired, adminOnly } = require("../../middlewares/auth");

router.use(authRequired, adminOnly);

router.get("/dashboard/simple", adminController.getSimpleDashboard);
router.get("/dashboard/advanced", adminController.getAdvancedDashboard);
router.post("/products", productController.createProduct);
router.patch("/products/:id", productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);
router.get("/users", adminController.getAllUsers);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.patch("/users/:id/ban", adminController.toggleBanUser);
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getOrderById);
router.patch("/orders/:id/status", adminController.updateOrderStatus);
router.get("/discounts", discountController.getAllDiscounts);
router.post("/discounts", discountController.createDiscount);

module.exports = router;
