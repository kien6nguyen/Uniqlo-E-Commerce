const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  priceSnapshot: { type: Number },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  color: { type: String, default: null },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true,
    default: null
  },
  sessionId: { type: String, sparse: true, default: null },
  items: [cartItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 30000 },
  supportFee: { type: Number, default: 0 },
  freeShipping: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  discountCode: { type: String, default: null },
  note: { type: String, default: null },
  total: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
