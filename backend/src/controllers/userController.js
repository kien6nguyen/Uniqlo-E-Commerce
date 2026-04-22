const bcrypt = require("bcrypt");
const User = require("../models/User");


const createFullAddress = (detail, ward, district, province) => {
    return `${detail}, ${ward}, ${district}, ${province}`;
};
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: "User not found" }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                fullname: user.fullname,
                hasPassword: !!user.password,
                shippingAddress: user.shippingAddress,
                wishlist: user.wishlist,
                loyaltyPoints: user.loyaltyPoints || 0,
                totalLoyaltyEarned: user.totalLoyaltyEarned || 0
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: { message: err.message }
        });
    }
};
exports.toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const index = user.wishlist.indexOf(productId);

        let type = '';
        if (index === -1) {
            user.wishlist.push(productId);
            type = 'added';
        } else {
            user.wishlist.splice(index, 1);
            type = 'removed';
        }

        await user.save();

        await user.populate('wishlist');

        res.status(200).json({
            success: true,
            message: type === 'added' ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích",
            wishlist: user.wishlist
        });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};
exports.syncWishlist = async (req, res) => {
    try {
        const { wishlist } = req.body;

        if (!Array.isArray(wishlist) || wishlist.length === 0) {
            return res.status(200).json({ success: true, message: "Nothing to sync" });
        }
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, error: "User not found" });
        const currentWishlistIds = user.wishlist.map(id => id.toString());
        wishlist.forEach(newItem => {
            const productId = typeof newItem === 'object' ? newItem.id : newItem;
            if (productId && !currentWishlistIds.includes(productId)) {
                user.wishlist.push(productId);
            }
        });
        await user.save();
        await user.populate('wishlist');
        res.json({
            success: true,
            message: "Đã đồng bộ danh sách yêu thích",
            wishlist: user.wishlist
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, error: { message: "User not found" } });
        }
        if (user.password) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, error: { message: "Vui lòng nhập mật khẩu hiện tại" } });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, error: { message: "Mật khẩu hiện tại không đúng" } });
            }
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, error: { message: "Mật khẩu xác nhận không khớp" } });
        }
        const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{5,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: { message: "Mật khẩu mới phải có ít nhất 5 ký tự và 1 ký tự đặc biệt" }
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Đổi mật khẩu thành công!"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: { message: err.message }
        });
    }
};

// Cập nhật thông tin user
exports.updateProfile = async (req, res) => {
    try {
        const { fullname } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fullname },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Cập nhật thông tin thành công!",

            data: {
                id: user._id,
                email: user.email,
                fullname: user.fullname,
                hasPassword: !!user.password,
                shippingAddress: user.shippingAddress,
                loyaltyPoints: user.loyaltyPoints || 0,
                totalLoyaltyEarned: user.totalLoyaltyEarned || 0
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: { message: err.message }
        });
    }
};

// Thêm địa chỉ
exports.addAddress = async (req, res) => {
    try {
        const { receiver, phone, province, district, ward, addressDetail } = req.body;

        if (!receiver || receiver.trim().length === 0) {
            return res.status(400).json({ success: false, error: "Người nhận không được để trống" });
        }
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ success: false, error: "Số điện thoại phải đúng 10 chữ số" });
        }

        const user = await User.findById(req.user.id);

        const fullAddress = createFullAddress(addressDetail, ward, district, province);
        const isDefault = user.shippingAddress.length === 0;
        user.shippingAddress.push({
            receiver,
            phone,
            address: fullAddress,
            province,
            district,
            ward,
            addressDetail,
            isDefault: isDefault
        });

        await user.save();

        const newAddress = user.shippingAddress[user.shippingAddress.length - 1];

        res.json({
            success: true,
            message: "Đã thêm địa chỉ mới!",
            address: newAddress,
            addresses: user.shippingAddress
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, error: "User not found" });
        const addressId = req.params.id;
        const address = user.shippingAddress.id(addressId);
        if (!address) {
            return res.status(404).json({ success: false, error: "Không tìm thấy địa chỉ" });
        }
        user.shippingAddress.forEach(addr => {
            addr.isDefault = false;
        });
        address.isDefault = true;
        await user.save();
        res.json({
            success: true,
            message: "Đã đặt làm địa chỉ mặc định",
            addresses: user.shippingAddress
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// Xóa địa chỉ
exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const addr = user.shippingAddress.id(req.params.id);
        if (!addr) {
            return res.status(404).json({ success: false, error: "Không tìm thấy địa chỉ" });
        }

        user.shippingAddress.pull({ _id: req.params.id });
        await user.save();

        res.json({
            success: true,
            message: "Đã xóa địa chỉ",
            addresses: user.shippingAddress
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


// SỬA: Thêm địa chỉ
exports.addAddress = async (req, res) => {
    try {
        // Nhận thêm các trường chi tiết
        const { receiver, phone, province, district, ward, addressDetail } = req.body;

        if (!receiver || receiver.trim().length === 0) {
            return res.status(400).json({ success: false, error: "Người nhận không được để trống" });
        }
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ success: false, error: "Số điện thoại phải đúng 10 chữ số" });
        }

        const user = await User.findById(req.user.id);

        // Tạo chuỗi địa chỉ đầy đủ để hiển thị (tương thích ngược với code cũ)
        const fullAddress = createFullAddress(addressDetail, ward, district, province);

        user.shippingAddress.push({
            receiver,
            phone,
            address: fullAddress, // Lưu chuỗi đầy đủ vào trường address cũ
            province,
            district,
            ward,
            addressDetail
        });

        await user.save();

        const newAddress = user.shippingAddress[user.shippingAddress.length - 1];

        res.json({
            success: true,
            message: "Đã thêm địa chỉ mới!",
            address: newAddress,
            addresses: user.shippingAddress
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// SỬA: Cập nhật địa chỉ
exports.updateAddress = async (req, res) => {
    try {
        const { receiver, phone, province, district, ward, addressDetail } = req.body;
        const user = await User.findById(req.user.id);

        const addr = user.shippingAddress.id(req.params.id);

        if (!addr) {
            return res.status(404).json({ success: false, error: "Không tìm thấy địa chỉ" });
        }

        const fullAddress = createFullAddress(addressDetail, ward, district, province);

        addr.receiver = receiver;
        addr.phone = phone;
        addr.province = province;
        addr.district = district;
        addr.ward = ward;
        addr.addressDetail = addressDetail;
        addr.address = fullAddress;

        await user.save();

        res.json({
            success: true,
            message: "Cập nhật địa chỉ thành công!",
            address: addr,
            addresses: user.shippingAddress
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


