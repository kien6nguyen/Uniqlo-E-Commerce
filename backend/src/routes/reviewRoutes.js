const express = require("express");
const router = express.Router();
const { addReview, getReviews, deleteReview } = require("../controllers/reviewController");
const { authRequired, adminOnly, optionalAuth } = require("../../middlewares/auth");

// Route: /api/reviews/products/:productId/reviews
router.post("/products/:productId/reviews", optionalAuth, addReview);

// Route: /api/reviews/products/:productId/reviews/:reviewId
router.delete("/products/:productId/reviews/:reviewId", authRequired, adminOnly, deleteReview);

// Route: /api/reviews/products/:productId/reviews
router.get("/products/:productId/reviews", getReviews);

module.exports = router;
