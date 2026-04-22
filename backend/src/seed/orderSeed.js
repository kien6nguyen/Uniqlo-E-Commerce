const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Discount = require("../models/DiscountCode");

const seedOrders = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // 1. XÓA SẠCH ĐƠN CŨ
    console.log("🗑️ Deleting old orders...");
    await Order.deleteMany({});

    // 2. LẤY DỮ LIỆU TỪ DB
    console.log("📦 Fetching live data...");
    const users = await User.find({ role: "user" });
    const products = await Product.find();
    const discounts = await Discount.find();

    // Tìm user test (ưu tiên client@gmail.com)
    let targetUser = users.find(u => u.email === "client@gmail.com");
    if (!targetUser) {
        console.log("⚠️ Không thấy client@gmail.com, lấy user đầu tiên.");
        targetUser = users[0];
    }

    // Lấy sản phẩm đại diện
    const pHigh = products.find(p => p.price > 20000000) || products[0]; // Macbook
    const pMid = products.find(p => p.price > 10000000 && p.price < 20000000) || products[1]; // Phone
    const pLow = products.find(p => p.price < 5000000) || products[2]; // Accessories

    const orders = [];
    console.log(`🚀 Creating orders for: ${targetUser.fullname} (${targetUser.email})...`);

    // --- HÀM HELPER LẤY ĐỊA CHỈ TỪ USER ---
    const getUserAddress = (user) => {
        if (user.shippingAddress && user.shippingAddress.length > 0) {
            const addr = user.shippingAddress.find(a => a.isDefault) || user.shippingAddress[0];
            return {
                receiver: addr.receiver || user.fullname,
                phone: addr.phone || "0909000111",
                address: addr.address || `${addr.addressDetail}, ${addr.ward}, ${addr.district}, ${addr.province}`
            };
        }
        return {
            receiver: user.fullname,
            phone: "0909999888",
            address: "Địa chỉ mặc định hệ thống, TP.HCM"
        };
    };

    const realShippingAddress = getUserAddress(targetUser);

    // =================================================================
    // TẠO 12 ĐƠN HÀNG PHÂN BỐ ĐỀU CÁC THÁNG
    // =================================================================
    
    for (let i = 0; i < 12; i++) {
        // 1. Tạo ngày: Lùi về i tháng
        const orderDate = new Date();
        orderDate.setMonth(orderDate.getMonth() - i);
        orderDate.setDate(Math.floor(Math.random() * 28) + 1);

        let items = [];
        let totalAmount = 0;
        let finalAmount = 0;
        let shippingFee = 30000;
        let supportFee = 0;
        let pointsUsed = 0;
        let discountAmt = 0;
        let discCode = null;
        let status = "Completed";

        // --- LOGIC PHÂN LOẠI ĐƠN HÀNG ---

        if (i === 0 || i === 6) {
            // ===> ĐÂY LÀ ĐƠN "FULL OPTION" (Tháng hiện tại & Tháng thứ 6) <===
            // Có đủ: Ship + Support + Voucher + Điểm
            items.push({ 
                product: pHigh._id, name: pHigh.name, 
                quantity: 2, price: pHigh.price, variant: "Full Option Config"
            });
            totalAmount = pHigh.price * 2;
            
            shippingFee = 50000; // Ship hỏa tốc
            supportFee = 20000;  // Phí bảo hiểm/gói quà
            
            // Voucher
            const disc = discounts.find(d => d.code === "NEW15");
            if (disc) {
                discCode = "NEW15";
                discountAmt = (totalAmount * disc.percentage) / 100;
            }

            // Dùng điểm
            pointsUsed = 500; // 500k

            status = i === 0 ? "Pending" : "Completed"; // Đơn mới nhất thì Pending để admin xử lý

        } else if (i % 3 === 1) {
            // ===> Đơn Freeship & Voucher (Không phụ phí) <===
            items.push({ 
                product: pMid._id, name: pMid.name, 
                quantity: 1, price: pMid.price 
            });
            totalAmount = pMid.price;
            shippingFee = 0; // Freeship
            
            const disc = discounts.find(d => d.code === "SALE5");
            if (disc) {
                discCode = "SALE5";
                discountAmt = (totalAmount * disc.percentage) / 100;
            }

        } else {
            // ===> Đơn thường hoặc Dùng điểm ít (Không Voucher) <===
            items.push({ 
                product: pLow._id, name: pLow.name, 
                quantity: 3, price: pLow.price 
            });
            totalAmount = pLow.price * 3;
            supportFee = 5000; // Phí nhỏ
            
            if (i % 2 === 0) {
                pointsUsed = 50; // Dùng 50k điểm
            }
        }

        // --- TÍNH TOÁN FINAL AMOUNT ---
        // Công thức: Hàng + Ship + Phụ phí - Voucher - (Điểm * 1000)
        finalAmount = Math.max(0, totalAmount + shippingFee + supportFee - discountAmt - (pointsUsed * 1000));

        // 3. Đẩy vào DB
        orders.push({
            user: targetUser._id,
            isGuest: false,
            items: items,
            shippingAddress: realShippingAddress,
            
            totalAmount: totalAmount,
            shippingFee: shippingFee,
            supportFee: supportFee,
            
            discountCode: discCode,
            discountAmount: discountAmt,
            
            loyaltyPointsUsed: pointsUsed,
            loyaltyPointsEarned: Math.floor(finalAmount / 10000), // Tích 10%
            
            finalAmount: Math.round(finalAmount),
            
            status: status,
            
            payment: { 
                method: "vnpay", 
                status: status === "Pending" ? "pending" : "paid", 
                paymentTime: status === "Pending" ? null : orderDate 
            },
            
            createdAt: orderDate,
            history: [{ status: status, updatedAt: orderDate }]
        });
    }

    await Order.insertMany(orders);
    console.log(`✅ Đã tạo ${orders.length} đơn hàng. Đơn mới nhất (Tháng 0) và Đơn tháng 6 là FULL OPTION.`);

    if (require.main === module) process.exit(0);
  } catch (error) {
    console.error("❌ Order Seed Error:", error);
    if (require.main === module) process.exit(1); else throw err;
  }
};

if (require.main === module) {
  seedOrders();
}

module.exports = seedOrders;