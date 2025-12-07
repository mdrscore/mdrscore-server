const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', requireAuth, userController.getMyProfile);
router.patch('/me/profile', requireAuth, userController.updateProfile);
router.post('/me/avatar', requireAuth, upload.single('avatar'), userController.uploadAvatar);
router.patch('/me/account', requireAuth, userController.updateAccountSettings);
router.delete('/me', requireAuth, userController.deleteAccount);

module.exports = router;