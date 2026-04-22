const User = require("../models/User");

// Lấy thông tin điểm thưởng
exports.getLoyaltyPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user)
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    res.status(200).json({
      success: true,
      userId: id,
      totalPoints: user.totalLoyaltyEarned,
      availablePoints: user.loyaltyPoints,
      usedPoints: user.totalLoyaltyEarned - user.loyaltyPoints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật điểm thưởng
exports.updateLoyaltyPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, points, reason } = req.body;

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    if (action === "add") {
      user.loyaltyPoints += points;
      user.totalLoyaltyEarned += points;
    } else if (action === "deduct") {
      if (user.loyaltyPoints < points)
        return res.status(400).json({ success: false, message: "Không đủ điểm để trừ" });
      user.loyaltyPoints -= points;
    } else {
      return res.status(400).json({ success: false, message: "Hành động không hợp lệ" });
    }

    await user.save();
    res.status(200).json({
      success: true,
      message:
        action === "add"
          ? `Thêm ${points} điểm thưởng thành công`
          : `Đã trừ ${points} điểm thưởng`,
      newBalance: user.loyaltyPoints,
      reason,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
