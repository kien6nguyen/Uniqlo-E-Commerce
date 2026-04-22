const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { optionalAuth } = require("../../middlewares/auth");

router.use(optionalAuth);

router.post("/", cartController.addOrUpdateItem);
router.put("/", cartController.addOrUpdateItem);
router.put("/quantity", cartController.updateItemQuantity);
router.delete("/:productId", cartController.removeItem);
router.delete("/", cartController.clearCart);
router.get("/summary", cartController.getCartSummary);
router.post("/apply-discount", cartController.applyDiscountCode);
router.post("/remove-discount", cartController.removeDiscountCode);
router.put("/note", cartController.updateCartNote);
module.exports = router;
