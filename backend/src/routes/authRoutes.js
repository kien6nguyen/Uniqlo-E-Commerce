const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authRequired } = require("../../middlewares/auth");
const passport = require("../../config/passport");

router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);
router.post("/register", authController.postRegister);
router.post("/forgotPassword", authController.sendResetLink);
router.post("/resetPassword", authController.resetPassword);

// Google OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    authController.googleCallback
);

module.exports = router;
