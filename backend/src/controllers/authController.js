const User = require("../models/User");
const bcrypt = require("bcrypt");
const { signToken } = require("../../config/jwt");
const jwt = require("jsonwebtoken");
const transporter = require("../../config/mailer");
const redisClient = require("../../config/redis");
const Cart = require("../models/Cart");

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const u = await User.findOne({ email });
        // Check if user is banned
        if (u.isBanned) {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để biết thêm chi tiết." });
        }
        if (!u) {
            return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }
        // Handle Google Auth users who don't have a password
        if (!u.password) {
            return res.status(401).json({ success: false, message: "Tài khoản này sử dụng đăng nhập Google. Vui lòng đăng nhập bằng Google." });
        }

        if (!(await bcrypt.compare(password, u.password))) {
            return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }

        const sessionId = req.sessionID;

        if (sessionId) {
            const sessionCart = await Cart.findOne({ sessionId: sessionId, user: null });

            if (sessionCart && sessionCart.items.length > 0) {
                let userCart = await Cart.findOne({ user: u._id });

                if (!userCart) {
                    sessionCart.user = u._id;
                    sessionCart.sessionId = undefined;
                    await sessionCart.save();
                } else {
                    for (const sessionItem of sessionCart.items) {
                        const existingIdx = userCart.items.findIndex(
                            item => String(item.product) === String(sessionItem.product) &&
                                String(item.variant || "") === String(sessionItem.variant || "") &&
                                String(item.color || "") === String(sessionItem.color || "")
                        );

                        if (existingIdx > -1) {
                            userCart.items[existingIdx].quantity += sessionItem.quantity;
                            userCart.items[existingIdx].price += sessionItem.price;
                        } else {
                            userCart.items.push(sessionItem);
                        }
                    }

                    userCart.subtotal = userCart.items.reduce((sum, i) => sum + (i.price || 0), 0);
                    userCart.tax = +(userCart.subtotal * 0.1).toFixed(2);
                    userCart.total = userCart.subtotal + userCart.tax + (userCart.shippingFee || 0) - (userCart.discount || 0);
                    await userCart.save();
                    await Cart.deleteOne({ _id: sessionCart._id });
                }
            }
        }

        const token = signToken({ id: u._id, email: u.email, role: u.role });
        return res.json({
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: { id: u._id, email: u.email, fullname: u.fullname, role: u.role }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
    }
};

exports.postLogout = async (req, res) => {
    try {
        const sessionId = req.sessionID;
        const userId = req.user?.id;

        if (sessionId && !userId) {
            await Cart.deleteOne({ sessionId, user: { $exists: false } }).catch(() => { /* non-fatal */ });
        }

        req.session?.destroy((err) => {
            res.clearCookie("connect.sid", { path: "/" });
            if (err) {
                console.error("Session destroy error:", err);
                return res.status(500).json({ ok: false, message: "Logout failed" });
            }
            return res.json({ ok: true, message: "Đăng xuất thành công" });
        });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ ok: false, message: "Lỗi khi đăng xuất" });
    }
};

exports.postRegister = async (req, res) => {
    try {
        const { email, password, fullname, confirmPassword, shippingAddress, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email đã được sử dụng." });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Mật khẩu xác nhận không khớp." });
        }
        const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{5,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 5 ký tự và 1 ký tự đặc biệt." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            fullname,
            shippingAddress: [{ receiver: fullname, phone: "", address: shippingAddress }],
            role: role || "user",
        });
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            user: { id: newUser._id, email, fullname }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
    }
};

exports.sendResetLink = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "Email không tồn tại" });
        }

        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "5m" });
        const resetLink = `${process.env.CLIENT_URL}/resetPassword?token=${token}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Link đặt lại mật khẩu",
            html: `<p>Click vào link để đặt lại mật khẩu (hết hạn 15 phút):</p>
             <a href="${resetLink}">${resetLink}</a>`
        });

        return res.json({ success: true, message: "Đã gửi link đặt lại mật khẩu đến email" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ error: "Thiếu token hoặc mật khẩu mới" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{5,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: "Mật khẩu phải có ít nhất 5 ký tự và 1 ký tự đặc biệt." });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.json({ message: "Đặt lại mật khẩu thành công" });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: "Link hết hạn hoặc không hợp lệ" });
    }
};

exports.googleCallback = (req, res) => {
    const token = signToken({ id: req.user._id, email: req.user.email, role: req.user.role });
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
};