const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");
const { authRequired, adminOnly } = require("../../middlewares/auth");

router.use(authRequired, adminOnly);

router.post("/", discountController.createDiscount);
router.get("/", discountController.getAllDiscounts);
router.put("/:id", discountController.updateDiscount);
router.delete("/:id", discountController.deleteDiscount);

module.exports = router;
