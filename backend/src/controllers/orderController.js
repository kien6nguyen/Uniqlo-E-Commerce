const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Discount = require("../models/DiscountCode");
const { sendOrderConfirmationEmail } = require("../../config/mailer");

exports.createOrder = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            discountCode,
            loyaltyPointsUsed,
            paymentMethod
        } = req.body;

        // Validate Input
        if (!items || items.length === 0) return res.status(400).json({ message: "Không có sản phẩm" });
        if (!shippingAddress) return res.status(400).json({ message: "Thiếu địa chỉ giao hàng" });

        // 1. Tính toán giá & Trừ tồn kho & Validate kho
        let totalAmount = 0;
        const orderItems = [];

        // Duyệt qua từng item để xử lý Logic Kho & Giá
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Sản phẩm ID ${item.product} không tồn tại` });
            }

            let priceToCharge = product.price; // Giá mặc định
            let variantNameSnapshot = null;
            let variantIdToSave = null;

            // --- LOGIC XỬ LÝ BIẾN THỂ (VARIANT) ---
            if (item.variantId) {
                // Tìm biến thể trong mảng variants của sản phẩm
                const variant = product.variants.id(item.variantId);

                if (!variant) {
                    return res.status(400).json({ message: `Phiên bản sản phẩm ${product.name} không tồn tại` });
                }

                // Kiểm tra kho của Variant
                if (variant.stock < item.quantity) {
                    return res.status(400).json({ message: `Sản phẩm "${product.name} - ${variant.name}" không đủ hàng (Còn: ${variant.stock})` });
                }

                // Trừ kho Variant
                variant.stock -= item.quantity;

                // Cập nhật giá & thông tin snapshot
                priceToCharge = variant.price;
                variantNameSnapshot = variant.name;
                variantIdToSave = variant._id;

            } else {
                // --- LOGIC XỬ LÝ SẢN PHẨM THƯỜNG (KHÔNG VARIANT) ---
                // Kiểm tra kho tổng (hoặc kho gốc)
                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Sản phẩm "${product.name}" không đủ hàng (Còn: ${product.stock})` });
                }
                // Trừ kho gốc
                product.stock -= item.quantity;
            }

            // Lưu thay đổi kho vào DB ngay lập tức
            await product.save();

            // Tính tổng tiền
            totalAmount += priceToCharge * item.quantity;

            // Push vào mảng items để lưu Order
            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: priceToCharge, // Giá tại thời điểm mua
                variantId: variantIdToSave, // ID Variant
                variantName: variantNameSnapshot, // Tên Variant (Snapshot)
                color: item.color || null
            });
        }

        // 2. Mã giảm giá
        let discountAmount = 0;
        if (discountCode) {
            const discount = await Discount.findOne({ code: discountCode });
            // Kiểm tra mã còn hạn/lượt dùng không (bổ sung logic check usageLimit nếu cần)
            if (discount && discount.isActive) {
                discountAmount = (totalAmount * discount.value) / 100;

                // Tăng lượt dùng mã (Optional)
                discount.usedCount = (discount.usedCount || 0) + 1;
                await discount.save();
            }
        }

        // Tạm tính
        let tempTotal = totalAmount - discountAmount;
        if (tempTotal < 0) tempTotal = 0;

        // 3. Xử lý Loyalty (Trừ điểm khách hàng)
        let pointsUsed = 0;
        let pointsValue = 0;
        let loyaltyEarned = 0;
        const userId = req.user ? req.user.id : null;

        if (userId) {
            const user = await User.findById(userId);
            if (user) {
                // Logic trừ điểm
                if (loyaltyPointsUsed > 0) {
                    pointsUsed = Math.min(loyaltyPointsUsed, user.loyaltyPoints || 0);
                    pointsValue = pointsUsed * 1000; // 1 điểm = 1000đ

                    if (pointsValue > tempTotal) {
                        pointsValue = tempTotal;
                        pointsUsed = Math.ceil(pointsValue / 1000);
                    }
                }
            }
        }

        // 4. Tổng cuối & Tính điểm Earn (Tích điểm)
        const finalAmount = Math.max(tempTotal - pointsValue, 0);

        if (userId) {
            // Earn 1 điểm cho mỗi 10.000đ
            loyaltyEarned = Math.floor(finalAmount / 10000);
        }

        // 5. Lưu Order
        const order = new Order({
            user: userId,
            isGuest: !userId,
            items: orderItems, // Mảng items đã xử lý kỹ ở trên
            shippingAddress,
            totalAmount,
            discountCode,
            discountAmount, // Nên lưu thêm trường này để thống kê
            loyaltyPointsUsed: pointsUsed,
            loyaltyPointsEarned: loyaltyEarned,
            finalAmount,
            payment: { method: paymentMethod || "cod" }
        });

        await order.save();

        // 6. Cập nhật User (Trừ điểm cũ, Cộng điểm mới)
        if (userId) {
            const user = await User.findById(userId);
            if (user) {
                user.loyaltyPoints = (user.loyaltyPoints || 0) - pointsUsed + loyaltyEarned;
                user.totalLoyaltyEarned = (user.totalLoyaltyEarned || 0) + loyaltyEarned;
                await user.save();
            }
            // Gửi mail cho user đăng nhập
            await sendOrderConfirmationEmail(req.user.email, order);
        } else if (shippingAddress.email) {
            // Gửi mail cho khách vãng lai
            await sendOrderConfirmationEmail(shippingAddress.email, order);
        }

        res.status(201).json({ success: true, message: "Tạo đơn thành công", order });

    } catch (err) {
        console.error("Create Order Error:", err);
        // Lưu ý: Nếu lỗi xảy ra sau khi đã trừ kho nhưng trước khi save Order, 
        // tồn kho sẽ bị lệch. Trong môi trường Production cần dùng MongoDB Transaction (Session).
        res.status(500).json({ success: false, message: err.message });
    }
};

// ... (Giữ nguyên các hàm getUserOrders, getOrderById, trackOrderStatus, updatePaymentStatus, getOrderByIdForGuest)

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log("Tìm đơn hàng cho User ID:", userId); 

    const orders = await Order.find({ user: userId })
      .populate("items.product", "name price images")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("items.product", "name price images");
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        if (req.user.role !== "admin" && order.user?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Không có quyền" });
        }
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.trackOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).select("status history");
        if (!order) return res.status(404).json({ message: "Not found" });
        res.json({ success: true, status: order.status, history: order.history });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                "payment.status": status,
                status: status === 'paid' ? 'Paid' : 'Pending',
                $push: { history: { status: status === 'paid' ? 'Paid' : 'Pending' } }
            },
            { new: true }
        );
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getOrderByIdForGuest = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, phone } = req.query;

        const order = await Order.findById(id).populate("items.product");
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn" });

        let isMatch = false;
        if (order.isGuest && order.shippingAddress) { // Sửa guestInfo thành shippingAddress vì schema lưu ở đó
            if (email && order.shippingAddress.email === email) isMatch = true;
            if (phone && order.shippingAddress.phone === phone) isMatch = true;
        }
        else if (req.user && order.user?.toString() === req.user.id) {
            isMatch = true;
        }

        if (!isMatch) return res.status(403).json({ message: "Thông tin xác thực không đúng" });

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy" });

        if (["Shipped", "Completed", "Cancelled"].includes(order.status)) {
            return res.status(400).json({ message: "Không thể hủy đơn ở trạng thái này" });
        }

        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                if (item.variantId) {
                    const variant = product.variants.id(item.variantId);
                    if (variant) {
                        variant.stock += item.quantity;
                    }
                } else {
                    product.stock += item.quantity;
                }
                await product.save();
            }
        }

        order.status = "Cancelled";
        order.history.push({ status: "Cancelled", note: "Người dùng hủy đơn" });

        if (order.loyaltyPointsUsed > 0 && order.user) {
            const user = await User.findById(order.user);
            if (user) {
                user.loyaltyPoints += order.loyaltyPointsUsed;

                if (order.loyaltyPointsEarned > 0) {
                    user.loyaltyPoints = Math.max(0, user.loyaltyPoints - order.loyaltyPointsEarned);
                    user.totalLoyaltyEarned = Math.max(0, user.totalLoyaltyEarned - order.loyaltyPointsEarned);
                }

                await user.save();
            }
        }

        if (order.discountCode) {
            const discount = await Discount.findOne({ code: order.discountCode });
            if (discount) {
                discount.usedCount = Math.max(0, discount.usedCount - 1);
                await discount.save();
            }
        }

        await order.save();
        res.json({ success: true, message: "Đã hủy đơn hàng và hoàn lại kho", order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};``