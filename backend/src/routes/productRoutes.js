const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require("../../middlewares/upload");
const { authRequired, adminOnly } = require("../../middlewares/auth");

// Product CRUD
router.post("/", authRequired, adminOnly, upload.array("images", 10), productController.createProduct);
router.get('/', productController.filterProduct);
router.get("/filters", productController.getFilterAttributes);

router.get('/:id', productController.getProduct);
router.put('/:id', authRequired, adminOnly, upload.array("images", 10), productController.updateProduct);
router.delete('/:id', authRequired, adminOnly, productController.deleteProduct);

// Product variants
router.post("/:id/variants", authRequired, adminOnly, productController.addVariant);
router.patch("/:id/variants/:variantId", authRequired, adminOnly, productController.updateVariant);
router.delete("/:id/variants/:variantId", authRequired, adminOnly, productController.deleteVariant);

module.exports = router;
