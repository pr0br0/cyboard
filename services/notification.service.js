const Notification = require('../models/notification.model');
const { sendEmail } = require('./email.service');

const notificationTemplates = {
    new_message: {
        title: {
            en: 'New Message',
            ru: 'Новое сообщение'
        },
        message: {
            en: 'You have a new message regarding "{listingTitle}"',
            ru: 'У вас новое сообщение по объявлению "{listingTitle}"'
        }
    },
    listing_expired: {
        title: {
            en: 'Listing Expired',
            ru: 'Срок объявления истек'
        },
        message: {
            en: 'Your listing "{listingTitle}" has expired',
            ru: 'Срок размещения объявления "{listingTitle}" истек'
        }
    },
    listing_approved: {
        title: {
            en: 'Listing Approved',
            ru: 'Объявление одобрено'
        },
        message: {
            en: 'Your listing "{listingTitle}" has been approved',
            ru: 'Ваше объявление "{listingTitle}" было одобрено'
        }
    },
    listing_rejected: {
        title: {
            en: 'Listing Rejected',
            ru: 'Объявление отклонено'
        },
        message: {
            en: 'Your listing "{listingTitle}" has been rejected',
            ru: 'Ваше объявление "{listingTitle}" было отклонено'
        }
    }
};

const createNotification = async ({ user, type, metadata = {}, link = '' }) => {
    const template = notificationTemplates[type];
    if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Заменяем плейсхолдеры в шаблоне
    const title = {
        en: template.title.en,
        ru: template.title.ru
    };

    const message = {
        en: template.message.en.replace(/{(\w+)}/g, (match, key) => metadata[key] || match),
        ru: template.message.ru.replace(/{(\w+)}/g, (match, key) => metadata[key] || match)
    };

    const notification = await Notification.create({
        user,
        type,
        title,
        message,
        link,
        metadata
    });

    return notification;
};

const sendNotification = async (params) => {
    const { user, type, metadata, link, sendEmail: shouldSendEmail = true } = params;

    // Создаем уведомление в базе данных
    const notification = await createNotification({
        user,
        type,
        metadata,
        link
    });

    // Отправляем email, если нужно
    if (shouldSendEmail && user.email && user.preferences?.notifications?.email) {
        const lang = user.preferences?.language || 'en';
        await sendEmail({
            to: user.email,
            subject: notification.title[lang],
            template: 'notification',
            data: {
                title: notification.title[lang],
                message: notification.message[lang],
                link: notification.link,
                userName: user.name
            }
        });
    }

    return notification;
};

module.exports = {
    createNotification,
    sendNotification,
    
    // Получение уведомлений пользователя
    getUserNotifications: async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
        const query = { user: userId };
        if (unreadOnly) {
            query.isRead = false;
        }

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort('-createdAt')
                .skip((page - 1) * limit)
                .limit(limit),
            Notification.countDocuments(query)
        ]);

        return {
            notifications,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total
            }
        };
    },

    // Отметить уведомления как прочитанные
    markAsRead: async (userId, notificationIds) => {
        await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                user: userId
            },
            { $set: { isRead: true } }
        );
    },

    // Удалить уведомления
    deleteNotifications: async (userId, notificationIds) => {
        await Notification.deleteMany({
            _id: { $in: notificationIds },
            user: userId
        });
    },

    // Получить количество непрочитанных уведомлений
    getUnreadCount: async (userId) => {
        return await Notification.countDocuments({
            user: userId,
            isRead: false
        });
    }
};