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
    let clientUrl = process.env.CLIENT_URL;
    if (clientUrl) {
        clientUrl = clientUrl.replace('http://https://', 'https://');
        clientUrl = clientUrl.replace('http://https//', 'https://');
        clientUrl = clientUrl.replace('https//', 'https://');
        clientUrl = clientUrl.replace('http//', 'http://');
    }
    res.redirect(`${clientUrl}/api/auth/login?token=${token}`);
};
