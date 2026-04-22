const mongoose = require("mongoose");
const Discount = require("../models/DiscountCode");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopdb";

const discounts = [
  {
    code: "SALE5",
    description: "Giảm 5% cho mọi đơn hàng",
    percentage: 5,
    usageLimit: 10,
    usedCount: 0,
    freeShipping: true,
  },
  {
    code: "SAV10",
    description: "Giảm 10% khi mua từ 5.000.000đ",
    percentage: 10,
    usageLimit: 10,
    minOrderValue: 5000000,
    freeShipping: false,
    usedCount: 4,
  },
  {
    code: "NEW15",
    description: "Giảm 15% khi mua từ 7.000.000đ",
    percentage: 15,
    usageLimit: 8,
    minOrderValue: 7000000,
    freeShipping: true,
    usedCount: 2,
  },
  {
    code: "FREES",
    description: "Miễn phí vận chuyển (tương đương 100% phí ship)",
    percentage: 100,
    usageLimit: 5,
    freeShipping: true,
    minOrderValue: 0,
    usedCount: 0,
  },
];

async function seedDiscounts() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ Connected to MongoDB");
    }

    // Xóa toàn bộ dữ liệu cũ trước khi insert
    await Discount.deleteMany({});
    console.log("🗑️ Old discounts removed");

    // Insert lại toàn bộ dữ liệu mới
    await Discount.insertMany(discounts);
    console.log("🌱 Discounts seeded successfully!");

    if (require.main === module) {
      await mongoose.connection.close();
      console.log("🔌 Connection closed");
    }
  } catch (err) {
    console.error("❌ Error seeding discounts:", err);
    if (require.main === module) {
      await mongoose.connection.close();
    } else {
      throw err;
    }
  }
}

if (require.main === module) {
  seedDiscounts();
}

module.exports = seedDiscounts;
