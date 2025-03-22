const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'new_message',
            'listing_expired',
            'listing_approved',
            'listing_rejected',
            'listing_view',
            'account_update',
            'system'
        ],
        required: true
    },
    title: {
        en: String,
        ru: String
    },
    message: {
        en: String,
        ru: String
    },
    link: String,
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Индексы
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;