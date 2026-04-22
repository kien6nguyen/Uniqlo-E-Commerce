const express = require("express");
const router = express.Router();
const socialController = require("../controllers/socialController");
const passport = require("../../config/passport");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  socialController.socialCallback
);

module.exports = router;