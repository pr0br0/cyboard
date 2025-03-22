const notificationService = require('../services/notification.service');
const AppError = require('../utils/AppError');

// Получить уведомления пользователя
const getNotifications = async (req, res, next) => {
    try {
        const { page, limit, unreadOnly } = req.query;
        const result = await notificationService.getUserNotifications(
            req.user._id,
            { page, limit, unreadOnly: unreadOnly === 'true' }
        );

        res.json({
            success: true,
            data: result.notifications,
            pagination: result.pagination
        });
    } catch (error) {
        next(new AppError('Error fetching notifications', 500));
    }
};

// Отметить уведомления как прочитанные
const markAsRead = async (req, res, next) => {
    try {
        const { notifications } = req.body;
        await notificationService.markAsRead(req.user._id, notifications);

        res.json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        next(new AppError('Error marking notifications as read', 500));
    }
};

// Удалить уведомления
const deleteNotifications = async (req, res, next) => {
    try {
        const { notifications } = req.body;
        await notificationService.deleteNotifications(req.user._id, notifications);

        res.json({
            success: true,
            message: 'Notifications deleted successfully'
        });
    } catch (error) {
        next(new AppError('Error deleting notifications', 500));
    }
};

// Получить количество непрочитанных уведомлений
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await notificationService.getUnreadCount(req.user._id);
        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        next(new AppError('Error getting unread count', 500));
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    deleteNotifications,
    getUnreadCount
};