const { signToken } = require("../../config/jwt");

exports.socialCallback = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Đăng nhập thất bại" });
    }
    const token = signToken({
        id: req.user._id,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
    });
     res.redirect(`${process.env.CLIENT_URL}/api/auth/login?token=${token}`);
};
