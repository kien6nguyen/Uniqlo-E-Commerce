const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authRequired } = require('../../middlewares/auth');

// All routes require authentication
router.use(authRequired);

// Profile routes
router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);
router.patch('/me/password', userController.changePassword);

// Address routes (nested under /me)
router.post('/me/addresses', userController.addAddress);
router.patch('/me/addresses/:id', userController.updateAddress);
router.delete('/me/addresses/:id', userController.deleteAddress);
router.patch('/me/addresses/:id/default', userController.setDefaultAddress);
router.post('/me/wishlist', userController.toggleWishlist);
router.post('/me/wishlist/sync', userController.syncWishlist);
module.exports = router;
