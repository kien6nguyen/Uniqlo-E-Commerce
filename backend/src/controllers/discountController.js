const Discount = require("../models/DiscountCode");

exports.createDiscount = async (req, res) => {
  try {
    const { code, description, percentage, usageLimit, minOrderValue, freeShipping } = req.body;

    if (!percentage) {
      return res.status(400).json({ success: false, message: "Thiếu phần trăm giảm giá" });
    }

    // Auto-generate 5-char code if not provided
    if (!code) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } else {
      // Validate provided code
      if (!/^[A-Z0-9]{5}$/.test(code.toUpperCase())) {
        return res.status(400).json({ success: false, message: "Mã giảm giá phải gồm 5 ký tự chữ và số." });
      }
    }

    const existing = await Discount.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Mã này đã tồn tại" });
    }

    const discount = await Discount.create({
      code: code.toUpperCase(),
      description,
      percentage,
      usageLimit: usageLimit || 10,
      minOrderValue: minOrderValue || 0,
      freeShipping: freeShipping || false,
      
      createdBy: req.user ? req.user.email : "System" 
    });

    res.status(201).json({ success: true, message: "Tạo mã giảm giá thành công", discount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllDiscounts = async (req, res) => {
  const discounts = await Discount.find();
  res.json({ success: true, discounts });
};

exports.updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, percentage, usageLimit, minOrderValue, freeShipping } = req.body;
    if (code) {
        const existing = await Discount.findOne({ 
            code: code.toUpperCase(), 
            _id: { $ne: id } 
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Mã code này đã được sử dụng bởi khuyến mãi khác" });
        }
    }
    const discount = await Discount.findByIdAndUpdate(
      id,
      { 
          code: code ? code.toUpperCase() : undefined, 
          description, 
          percentage, 
          usageLimit, 
          minOrderValue, 
          freeShipping 
      },
      { new: true }
    );
    if (!discount)
      return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá" });
    res.json({ success: true, message: "Cập nhật thành công", discount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    await Discount.findByIdAndDelete(id);
    res.json({ success: true, message: "Đã xóa mã giảm giá" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
