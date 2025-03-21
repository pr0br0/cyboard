const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    getNotifications,
    markAsRead,
    deleteNotifications,
    getUnreadCount
} = require('../controllers/notification.controller');

// Все маршруты требуют аутентификации
router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-read', markAsRead);
router.delete('/', deleteNotifications);

module.exports = router;