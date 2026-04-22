const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  isGuest: { type: Boolean, default: true },

  // Thông tin khách hàng vãng lai (nếu không đăng nhập)
  // Lưu ý: Nếu user đăng nhập, shippingAddress thường được ưu tiên dùng
  guestInfo: {
    fullname: { type: String },
    email: { type: String },
    phone: { type: String },
  },

  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }, // Giá tại thời điểm mua (đã chốt)

      variantId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Lưu ID để xử lý logic kho
      variantName: { type: String, default: null }, // Lưu tên hiển thị (VD: "RAM 8GB")
      color: { type: String, default: null },       // Lưu màu sắc (VD: "Xanh")
      // -------------------------
    },
  ],

  totalAmount: { type: Number, required: true, min: 0 }, // Tổng tiền hàng (chưa trừ KM)

  status: {
    type: String,
    enum: ["Pending", "Paid", "Shipped", "Completed", "Cancelled"],
    default: "Pending"
  },
  discountCode: {
    type: String,
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  tax: { type: Number, default: 0 },
  supportFee: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  finalAmount: {
    type: Number,
    required: true,
    min: 0,
  }, // Số tiền khách phải trả cuối cùng

  payment: {
    method: {
      type: String,
      enum: ["cod", "vnpay"],
      default: "cod",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: { type: String, required: false },
    bankCode: { type: String, required: false },
    paymentTime: { type: Date },
  },
  note: {
    type: String,
    default: "",
  },
  history: [
    {
      status: {
        type: String,
        enum: ["Pending", "Paid", "Shipped", "Completed", "Cancelled"],
      },
      note: { type: String }, // Thêm ghi chú cho lịch sử (VD: "Người dùng hủy đơn")
      updatedAt: { type: Date, default: Date.now },
    },
  ],

  shippingAddress: {
    receiver: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String },
  },

  loyaltyPointsEarned: { type: Number, default: 0 },
  loyaltyPointsUsed: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre("save", function (next) {
  if (this.isNew) {
    if (!this.history || this.history.length === 0) {
      this.history = [{ status: this.status, note: "Đơn hàng được tạo" }];
    }
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Order", orderSchema);