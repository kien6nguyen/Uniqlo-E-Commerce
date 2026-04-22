const { verifyToken } = require("../config/jwt");
const redisClient = require("../config/redis");

const getTokenFromRequest = (req) => {
  return req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || req.cookies?.token;
    if (token) {
      const isBlacklisted = await redisClient.get(`bl_${token}`);
      if (!isBlacklisted) {
        const decoded = verifyToken(token);
        req.user = decoded;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

const authRequired = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Bạn cần đăng nhập để thực hiện thao tác này.",
    });
  }
  try {
    const isBlacklisted = await redisClient.get(`bl_${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.",
      });
    }
    const user = verifyToken(token);
    if (!user) {
      throw new Error("Token verification returned null");
    }
    req.user = user;
    next();

  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    const message = err.name === "TokenExpiredError"
      ? "Phiên đăng nhập đã hết hạn."
      : "Token không hợp lệ.";
    return res.status(401).json({
      success: false,
      message: message,
    });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng.",
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập tài nguyên này.",
      });
    }
    next();
  };
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Chưa xác thực người dùng (Vui lòng đặt authRequired trước middleware này).",
    });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ admin mới được phép truy cập.",
    });
  }
  next();
};

module.exports = {
  authRequired,
  allowRoles,
  adminOnly,
  optionalAuth
};