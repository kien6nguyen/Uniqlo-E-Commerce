const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  password: { type: String, default: "password1" },
  shippingAddress: [
    {
      receiver: String,
      phone: String,
      address: String,      
      province: String,     
      district: String,      
      ward: String,          
      addressDetail: String,
      isDefault: { type: Boolean, default: false }
    }
  ],
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ["user", "admin","customer"], default: "user" },
  isBanned: { type: Boolean, default: false },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalLoyaltyEarned: { 
    type: Number, 
    default: 0 
  },
  wishlist: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
