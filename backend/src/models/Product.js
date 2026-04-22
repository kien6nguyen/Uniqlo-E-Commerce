const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String, trim: true }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    gender: {
      type: String,
      enum: ["woman", "man", "kids", "baby"],
      required: true
    },

    category: {
      type: String,
      enum: [
        "tops",         // Áo (t-shirt, shirt, blouse, sweater...)
        "bottoms",      // Quần (jeans, pants, skirts, shorts...)
        "outerwear",    // Áo khoác ngoài (jacket, coat, parka...)
        "innerwear",    // Đồ lót (bra, underwear, bralette...)
        "heattech",     // Đồ giữ nhiệt (heattech top, leggings...)
        "activewear",   // Đồ thể thao (sports top, tights, shorts...)
        "loungewear",   // Đồ mặc nhà / pyjama
        "socks",        // Tất / vớ
        "accessories"   // Phụ kiện (mũ, khăn, túi...)
      ],
      required: true
    },


    // Dòng sản phẩm đặc trưng của Uniqlo
    productLine: {
      type: String,
      enum: [
        "HEATTECH",           // Giữ nhiệt
        "AIRism",             // Thoáng mát, kháng khuẩn
        "Ultra Light Down",   // Lông vũ siêu nhẹ
        "Fleece",             // Lông cừu
        "Cashmere",           // Len cashmere
        "Supima Cotton",      // Cotton cao cấp
        "Linen",              // Vải lanh
        "Lifewear Essentials",// Cơ bản hàng ngày
        "Smart Ankle Pants",  // Quần ankle thông minh
        "Kando Pants",        // Quần Kando
        "3D Knit",            // Len 3D
        "BlockTech",          // Chống gió / nước
        "Other"               // Không thuộc dòng đặc biệt
      ],
      default: "Other"
    },

    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    images: [String],
    tags: [{ type: String }],
    variants: [variantSchema],

    isHotDeal: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: false }
  },

  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
