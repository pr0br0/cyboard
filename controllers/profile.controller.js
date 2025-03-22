const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const { cloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const { sendEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');

// Получить профиль
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('listings', 'title status images price createdAt')
            .populate('favorites', 'title status images price');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(new AppError('Error fetching profile', 500));
    }
};

// Обновить профиль
const updateProfile = async (req, res, next) => {
    try {
        const allowedUpdates = ['name', 'phone', 'location', 'preferences'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        if (Object.keys(updates).length === 0) {
            return next(new AppError('No valid updates provided', 400));
        }

        // Обработка аватара
        if (req.file) {
            // Удаляем старый аватар
            if (req.user.avatar?.public_id) {
                await cloudinary.uploader.destroy(req.user.avatar.public_id);
            }

            updates.avatar = {
                url: req.file.path,
                public_id: req.file.filename
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        next(new AppError('Error updating profile', 500));
    }
};

// Изменить email
const updateEmail = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Проверяем пароль
        const user = await User.findById(req.user._id).select('+password');
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return next(new AppError('Invalid password', 401));
        }

        // Проверяем, не занят ли email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('Email already in use', 400));
        }

        // Генерируем токен верификации
        const verificationToken = user.generateVerificationToken();
        user.email = email;
        user.emailVerified = false;
        await user.save();

        // Отправляем email для подтверждения
        await sendEmail({
            to: email,
            template: 'email-verification',
            data: {
                name: user.name,
                verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
            }
        });

        res.json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (error) {
        next(new AppError('Error updating email', 500));
    }
};

// Изменить пароль
const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return next(new AppError('Current password is incorrect', 401));
        }

        user.password = newPassword;
        await user.save();

        // Отправляем уведомление
        await sendEmail({
            to: user.email,
            template: 'password-changed',
            data: {
                name: user.name
            }
        });

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(new AppError('Error updating password', 500));
    }
};

// Подтвердить номер телефона
const verifyPhone = async (req, res, next) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.phone.verificationCode || 
            user.phone.verificationCode !== code ||
            Date.now() > user.phone.verificationExpires) {
            return next(new AppError('Invalid or expired verification code', 400));
        }

        user.phone.verified = true;
        user.phone.verificationCode = undefined;
        user.phone.verificationExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Phone number verified successfully'
        });
    } catch (error) {
        next(new AppError('Error verifying phone number', 500));
    }
};

// Отправить код подтверждения телефона
const sendPhoneVerification = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const code = user.generatePhoneVerificationCode();
        await user.save();

        // Отправляем SMS
        await sendSMS({
            to: user.phone.number,
            message: `Your verification code is: ${code}`
        });

        res.json({
            success: true,
            message: 'Verification code sent'
        });
    } catch (error) {
        next(new AppError('Error sending verification code', 500));
    }
};

// Обновить настройки уведомлений
const updateNotificationSettings = async (req, res, next) => {
    try {
        const { email, push } = req.body.notifications;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                'preferences.notifications': { email, push }
            },
            { new: true }
        );

        res.json({
            success: true,
            data: user.preferences.notifications
        });
    } catch (error) {
        next(new AppError('Error updating notification settings', 500));
    }
};

// Удалить аккаунт
const deleteAccount = async (req, res, next) => {
    try {
        const { password } = req.body;

        const user = await User.findById(req.user._id).select('+password');
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return next(new AppError('Invalid password', 401));
        }

        // Удаляем аватар
        if (user.avatar?.public_id) {
            await cloudinary.uploader.destroy(user.avatar.public_id);
        }

        // Удаляем все объявления пользователя
        const listings = await Listing.find({ author: user._id });
        for (const listing of listings) {
            // Удаляем изображения объявлений
            for (const image of listing.images) {
                await cloudinary.uploader.destroy(image.public_id);
            }
            await listing.deleteOne();
        }

        // Удаляем пользователя
        await user.deleteOne();

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        next(new AppError('Error deleting account', 500));
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updateEmail,
    updatePassword,
    verifyPhone,
    sendPhoneVerification,
    updateNotificationSettings,
    deleteAccount
};