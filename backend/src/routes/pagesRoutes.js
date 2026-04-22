const express = require('express');
const { authRequired, allowRoles, getUserFromToken } = require('../../middlewares/auth');
const router = express.Router();

router.get("/", (req, res) => {
  const user = getUserFromToken(req);
  res.json({
    message: "Welcome to API",
    user: user || null,
    error: req.query.error || ""
  });
});

router.get('/admin', authRequired, allowRoles('admin'), (req, res) => {
  res.json({
    message: "Welcome admin",
    user: req.user
  });
});

module.exports = router;
