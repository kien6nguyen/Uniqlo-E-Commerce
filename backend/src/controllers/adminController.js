const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");


// Simple Dashboard - tổng quan nhanh
exports.getSimpleDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const totalOrders = await Order.countDocuments();
    const totalRevenueAgg = await Order.aggregate([
      { $match: { status: { $in: ["Paid", "Shipped", "Completed"] } } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const bestSellingProducts = await Order.aggregate([
      { $match: { status: { $in: ["Paid", "Shipped", "Completed"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$productInfo.name", "Sản phẩm đã xóa/ẩn"] },
          totalSold: 1,
        },
      },
    ]);
    res.json({
      success: true,
      data: {
        totalUsers,
        newUsersThisMonth,
        totalOrders,
        totalRevenue,
        bestSellingProducts,
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Advanced Dashboard - thống kê nâng cao theo thời gian
exports.getAdvancedDashboard = async (req, res) => {
  try {
    const { startDate, endDate, interval = "year" } = req.query;
    const start = startDate ? new Date(startDate) : new Date("2020-01-01");
    const end = endDate ? new Date(endDate) : new Date();

    const dateGroup =
      interval === "month"
        ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }
        : interval === "quarter"
          ? { year: { $year: "$createdAt" }, quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } } }
          : interval === "week"
            ? { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } }
            : { year: { $year: "$createdAt" } }; // default: year

    const stats = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: "Completed" } },
      {
        $group: {
          _id: dateGroup,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          // Mock profit as 20% of revenue since we don't have cost price
          totalProfit: { $sum: { $multiply: ["$finalAmount", 0.2] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.quarter": 1, "_id.week": 1 } },
    ]);

    // Breakdown by product category (types of products sold)
    const productTypeStats = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: "Completed" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          count: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.price" }
        }
      }
    ]);

    res.json({
      success: true,
      data: { interval, startDate: start, endDate: end, stats, productTypeStats },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// USER MANAGEMENT
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, message: "User banned", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ORDER MANAGEMENT
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, range, startDate, endDate, userId } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    const now = new Date();
    if (userId) {
        filter.user = userId;
    }
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (range === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start };
    } else if (range === "yesterday") {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start, $lt: end };
    } else if (range === "week") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      filter.createdAt = { $gte: start };
    } else if (range === "month") {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      filter.createdAt = { $gte: start };
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "fullname email")
      .populate("items.product", "name");

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user items.product");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateOrderStatus = async (req, res) => {
  try {
    // 1. Lấy status từ body
    const { status } = req.body;

    // 2. Validate (tuỳ chọn nhưng nên có để tránh lỗi data)
    const validStatuses = ["Pending", "Paid", "Shipped", "Completed", "Cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    // 3. Cập nhật trong DB
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );

    // 4. Kiểm tra kết quả
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    // 5. Trả về kết quả
    res.json({ success: true, message: "Cập nhật trạng thái thành công", order });

  } catch (err) {
    console.error("Lỗi update status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// PRODUCT MANAGEMENT

exports.adminCreateProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json({ success: true, message: "Product created", product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.adminUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminDeleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// USER MANAGEMENT
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullname, email, role, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email đã tồn tại" });

    const newUser = await User.create({
      fullname,
      email,
      role,
      password: password || "123456"
    });

    res.status(201).json({ success: true, message: "Tạo người dùng thành công", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy tất cả các trường cần thiết, bao gồm mảng shippingAddress đầy đủ từ frontend
    const {
      fullname, role, password,
      addressDetail, province, district, ward, phone, receiver, // Các trường lẻ (nếu dùng form chính)
      loyaltyPoints,
      shippingAddress // Mảng địa chỉ đầy đủ (nếu dùng dialog quản lý địa chỉ)
    } = req.body;

    const updates = {};

    // Cập nhật thông tin cơ bản
    if (fullname) updates.fullname = fullname;
    if (role) updates.role = role;
    if (loyaltyPoints !== undefined && loyaltyPoints !== null && loyaltyPoints !== "") {
      updates.loyaltyPoints = Number(loyaltyPoints);
    }
    if (password && password.trim() !== "") {
      updates.password = password;
    }
    if (shippingAddress && Array.isArray(shippingAddress)) {
      updates.shippingAddress = shippingAddress;
    }
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, message: "Cập nhật thành công", user });
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, message: "User banned", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      success: true,
      message: user.isBanned ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ORDER MANAGEMENT
