const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const { validate, profileValidator } = require('../utils/validators');
const {
    getProfile,
    updateProfile,
    updateEmail,
    updatePassword,
    verifyPhone,
    sendPhoneVerification,
    updateNotificationSettings,
    deleteAccount
} = require('../controllers/profile.controller');

// Все маршруты требуют аутентификации
router.use(auth);

router.get('/', getProfile);

router.put('/',
    handleUpload.single('avatar'),
    validate(profileValidator.updateProfile),
    updateProfile
);

router.put('/email',
    validate(profileValidator.updateEmail),
    updateEmail
);

router.put('/password',
    validate(profileValidator.updatePassword),
    updatePassword
);

router.post('/verify-phone',
    validate(profileValidator.verifyPhone),
    verifyPhone
);

router.post('/send-phone-verification',
    sendPhoneVerification
);

router.put('/notifications',
    validate(profileValidator.updateNotifications),
    updateNotificationSettings
);

router.delete('/',
    validate(profileValidator.deleteAccount),
    deleteAccount
);

module.exports = router;