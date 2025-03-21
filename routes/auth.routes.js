const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate, authValidator } = require('../utils/validators');
const {
    register,
    login,
    verifyEmail,
    verifyPhone,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    logout
} = require('../controllers/auth.controller');

// Публичные маршруты
router.post('/register', validate(authValidator.register), register);
router.post('/login', validate(authValidator.login), login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validate(authValidator.forgotPassword), forgotPassword);
router.post('/reset-password', validate(authValidator.resetPassword), resetPassword);

// Защищенные маршруты
router.use(auth);

router.get('/profile', getProfile);
router.put('/profile', validate(authValidator.updateProfile), updateProfile);
router.post('/verify-phone', validate(authValidator.verifyPhone), verifyPhone);
router.post('/change-password', validate(authValidator.changePassword), changePassword);
router.post('/logout', logout);

module.exports = router;