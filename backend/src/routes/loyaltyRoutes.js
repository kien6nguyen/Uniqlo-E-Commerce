const express = require("express");
const router = express.Router();
const loyaltyController = require("../controllers/loyaltyController");
const { authRequired } = require("../../middlewares/auth");

router.get("/user/:id/loyalty", authRequired, loyaltyController.getLoyaltyPoints);
router.patch("/user/:id/loyalty", authRequired, loyaltyController.updateLoyaltyPoints);

module.exports = router;
