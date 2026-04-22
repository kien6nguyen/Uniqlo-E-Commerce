const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 5,
    maxlength: 5,
    match: /^[A-Z0-9]{5}$/, // 5-character alphanumeric
    trim: true,
  },
  description: { type: String },
  percentage: { type: Number, required: true, min: 1, max: 100 },
  usageLimit: { type: Number, default: 10, max: 10 },
  usedCount: { type: Number, default: 0 },
  minOrderValue: { type: Number, default: 0 },
  freeShipping: { type: Boolean, default: false },
  createdBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Discount", discountSchema);
