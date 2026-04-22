const Review = require("../models/Review");
const Product = require("../models/Product");

exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;

    if (!rating && !comment) {
      return res.status(400).json({ message: "Rating or comment is required" });
    }

    if (rating && !user) {
      return res.status(401).json({ message: "Bạn cần đăng nhập để đánh giá sao." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = new Review({
      product: productId,
      user: user ? user.id : null,
      rating: rating || null,
      comment,
    });

    await review.save();

    if (rating) {
      const allReviews = await Review.find({ product: productId, rating: { $ne: null } });
      const avg =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      product.averageRating = avg.toFixed(1);
      await product.save();
    }

    const io = req.app.get("io");
    if (io) {
      if (review.user) {
        await review.populate("user", "fullname email");
      }
      io.emit("new_review", {
        productId,
        review,
        averageRating: product.averageRating
      });
    }

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
      averageRating: product.averageRating,
    });
  } catch (err) {
    console.error("Error in addReview:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    await Review.findByIdAndDelete(reviewId);
    const allReviews = await Review.find({
      product: productId,
      rating: { $ne: null },
    });

    const avg =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;
    product.averageRating = avg.toFixed(1);
    await product.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("delete_review", {
        productId,
        reviewId,
        averageRating: product.averageRating
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
      averageRating: product.averageRating,
    });
  } catch (err) {
    console.error("Error in deleteReview:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "fullname email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (err) {
    console.error("Error in getReviews:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};