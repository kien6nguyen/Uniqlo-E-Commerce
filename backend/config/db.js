const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/shopdb");
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    // Không dùng process.exit(1) để server vẫn sống và hiện log debug
  }
};

module.exports = connectDB;
