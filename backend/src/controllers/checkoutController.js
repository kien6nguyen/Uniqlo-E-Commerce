const Cart = require("../models/Cart");
const User = require("../models/User");
const Order = require("../models/Order");
const Discount = require("../models/DiscountCode");
const bcrypt = require("bcrypt");
const { transporter } = require("../../config/mailer");

exports.checkout = async (req, res) => {
  try {
    const {
      email,
      fullname,
      shippingAddress,
      paymentMethod,
      phone,
      discountCode,
      loyaltyPointsUsed,
      supportFee,
      addToWishlist,
      note
    } = req.body;

    const userId = req.user?.id;
    const sessionId = req.sessionID;

    if (!email || !fullname || !phone || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin"
      });
    }

    const cart = userId
      ? await Cart.findOne({ user: userId })
      : await Cart.findOne({ sessionId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống"
      });
    }

    let user = null;
    let isNewUser = false;

    if (!userId) {
      user = await User.findOne({ email });

      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashed = await bcrypt.hash(randomPassword, 10);

        user = new User({
          email,
          fullname,
          password: hashed,
          role: "user",
          shippingAddress: [{
            receiver: fullname,
            phone: phone,
            address: shippingAddress,
          }],
        });

        await user.save();
        isNewUser = true;

        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Tài khoản của bạn đã được tạo",
          html: `
            <h2>Chào mừng ${fullname}!</h2>
            <p>Tài khoản của bạn đã được tạo tự động khi thanh toán.</p>
            <p><strong>Email:</strong> ${email}</p>
             <p><strong>Password:</strong> ${randomPassword}</p>
            <p>Vui lòng đăng nhập và đặt lại mật khẩu tại trang Profile.</p>
            <p>Link đăng nhập: <a href="${process.env.CLIENT_URL}/login">${process.env.CLIENT_URL}/login</a></p>
          `
        }).catch(err => console.error("Email send error:", err));

        cart.user = user._id;
        cart.sessionId = undefined;
        await cart.save();
      } else {
        if (!req.session.guestInfo) {
          req.session.guestInfo = {};
        }
        req.session.guestInfo = {
          fullname,
          phone,
          address: shippingAddress
        };
      }
    } else {
      user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng"
        });
      }
    }
    if (addToWishlist && user) {
      const productIds = cart.items.map(item => item.product);
      if (user.wishlist) {
        productIds.forEach(pid => {
          if (!user.wishlist.includes(pid)) {
            user.wishlist.push(pid);
          }
        });
        await user.save();
      }
    }
    let totalAmount = 0;
    if (cart && cart.items) {
      totalAmount = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    } let actualShippingFee = cart.freeShipping ? 0 : (cart.shippingFee || 30000);
    let discountAmount = 0;

    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode.toUpperCase() });
      if (discount && discount.usedCount < discount.usageLimit) {
        if (discount.minOrderValue > 0 && totalAmount < discount.minOrderValue) {
          return res.status(400).json({ message: `Đơn tối thiểu ${discount.minOrderValue}đ để dùng mã này` });
        }
        discountAmount = (totalAmount * discount.percentage) / 100;
        if (discount.freeShipping) actualShippingFee = 0;

        discount.usedCount += 1;
        await discount.save();
      }
    }


    const supportAmount = supportFee ? 55000 : 0;

    const tax = totalAmount * 0.1;
    
    let tempTotal = totalAmount + tax + actualShippingFee + supportAmount - discountAmount;
    if (tempTotal < 0) tempTotal = 0;
    let pointsUsed = 0;
    let pointsValue = 0;

    if (userId && loyaltyPointsUsed > 0) {
      const availablePoints = user.loyaltyPoints || 0;
      pointsUsed = Math.min(loyaltyPointsUsed, availablePoints);
      pointsValue = pointsUsed * 1000;
      if (pointsValue > tempTotal) {
        pointsValue = tempTotal;
        pointsUsed = Math.ceil(pointsValue / 1000);
      }
    }
    const finalAmount = Math.max(tempTotal - pointsValue, 0);
    const loyaltyEarned = userId ? Math.floor(finalAmount / 10000) : 0;
    const orderData = {
      user: userId ? user._id : user._id,
      isGuest: !userId,
      items: cart.items,
      shippingAddress: {
        receiver: fullname,
        phone: phone,
        address: shippingAddress
      },
      totalAmount,
      tax: tax,
      shippingFee: actualShippingFee,
      supportFee: supportAmount,
      finalAmount,
      discountCode: discountCode || null,
      loyaltyPointsUsed: pointsUsed,
      loyaltyPointsEarned: loyaltyEarned,
      note: note || "",
      payment: {
        method: paymentMethod || "cod",
        status: "pending"
      },
      status: "Pending"
    };

    if (!userId) {
      orderData.guestInfo = {
        fullname,
        email,
        phone
      };
    }

    const order = new Order(orderData);
    await order.save();
    if (cart) {
      cart.items = [];
      cart.totalAmount = 0;
      cart.discountCode = null; 
      cart.freeShipping = false;
      cart.shippingFee = 30000; 
      cart.note = ""; 
      await cart.save();
    }
    if (userId) {
      user.loyaltyPoints = user.loyaltyPoints - pointsUsed + loyaltyEarned;
      user.totalLoyaltyEarned = (user.totalLoyaltyEarned || 0) + loyaltyEarned;
      await user.save();
    }
    let statusText = "Chờ xác nhận";
    if (paymentMethod === 'vnpay') {
      statusText = "Đơn hàng đã tạo - Chờ hoàn tất thanh toán";
    } else {
      statusText = "Chờ xác nhận - Thanh toán khi nhận hàng";
    }
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Hóa đơn đơn hàng #${order._id}`,
      html: `
        <h2>Cảm ơn bạn đã đặt hàng!</h2>
        <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
        <p><strong>Người nhận:</strong> ${fullname}</p>
        <p><strong>Số điện thoại:</strong> ${phone}</p>
        <p><strong>Địa chỉ:</strong> ${shippingAddress}</p>
        <p><strong>Phương thức thanh toán:</strong> ${paymentMethod === 'vnpay' ? 'VNPAY' : 'Thanh toán khi nhận hàng (COD)'}</p>
        <p><strong>Phí vận chuyển:</strong> ${actualShippingFee.toLocaleString('vi-VN')}₫</p>
        ${supportAmount > 0 ? `<p><strong>Phí hỗ trợ:</strong> ${supportAmount.toLocaleString('vi-VN')}₫</p>` : ''}
        <p><strong>Tổng tiền:</strong> ${finalAmount.toLocaleString('vi-VN')}₫</p>
        <p><strong>Trạng thái:</strong> Chờ thanh toán</p>
        ${isNewUser ? '<p><em>Tài khoản của bạn đã được tạo. Vui lòng đăng nhập và đặt lại mật khẩu.</em></p>' : ''}
      `
    }).catch(err => console.error("Email send error:", err));

    res.json({
      success: true,
      message: "Đã tạo đơn hàng",
      order: {
        id: order._id,
        finalAmount: order.finalAmount
      },
      userCreated: isNewUser
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getCheckoutInfo = async (req, res) => {
  try {
    const userId = req.user?.id;

    let userData = null;
    let savedAddress = null;

    if (userId) {
      const user = await User.findById(userId)
        .select('fullname email shippingAddress loyaltyPoints');

      if (user) {
        userData = {
          fullname: user.fullname,
          email: user.email,
          phone: user.shippingAddress[0]?.phone || "",
          addresses: user.shippingAddress,
          loyaltyPoints: user.loyaltyPoints || 0
        };
      }
    } else {
      if (req.session.guestInfo) {
        savedAddress = req.session.guestInfo;
      }
    }

    const discounts = await Discount.aggregate([
      {
        $match: {
          $expr: { $lt: ["$usedCount", "$usageLimit"] }
        }
      },
      {
        $project: {
          code: 1,
          description: 1,
          percentage: 1,
          usageLimit: 1,
          usedCount: 1,
          minOrderValue: 1,
          freeShipping: 1
        }
      }
    ]);

    res.json({
      success: true,
      userData,
      savedAddress,
      discounts
    });
  } catch (err) {
    console.error("Get checkout info error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};