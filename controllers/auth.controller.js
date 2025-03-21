const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');
const logger = require('../utils/logger');

// Генерация JWT токена
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
};

// Регистрация
const register = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Проверка существования пользователя
        const userExists = await User.findOne({ 
            $or: [{ email }, { 'phone.number': phone }] 
        });
        
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: userExists.email === email ? 'Email already registered' : 'Phone number already registered'
            });
        }

        // Создание нового пользователя
        const user = await User.create({
            email,
            password,
            name,
            phone: {
                number: phone,
                verified: false
            }
        });

        // Генерация токена верификации
        const verificationToken = user.generateVerificationToken();

        // Отправка письма с подтверждением
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        await sendEmail({
            email: user.email,
            subject: 'Please verify your email',
            template: 'emailVerification',
            data: {
                name: user.name,
                verificationUrl
            }
        });

        // Генерация токена доступа
        const token = generateToken(user._id);

        // Отправка SMS с кодом верификации
        const phoneVerificationCode = user.generatePhoneVerificationCode();
        // TODO: Добавить отправку SMS

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token,
                emailVerified: false,
                phoneVerified: false
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Вход
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя
        const user = await User.findOne({ email }).select('+password');
        if (!user || user.status === 'banned') {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Проверка пароля
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Обновление времени последнего входа и активности
        user.lastLogin = new Date();
        user.lastActive = new Date();
        await user.save();

        // Генерация токена
        const token = generateToken(user._id);

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                phoneVerified: user.phone.verified,
                token
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Подтверждение email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Проверка токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid verification token'
            });
        }

        // Подтверждение email
        user.emailVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(400).json({
            success: false,
            error: 'Invalid verification token'
        });
    }
};

// Подтверждение телефона
const verifyPhone = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.phone.verificationCode || 
            user.phone.verificationCode !== code ||
            Date.now() > user.phone.verificationExpires) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification code'
            });
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
        logger.error('Phone verification error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Запрос сброса пароля
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Генерация токена сброса пароля
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Отправка письма
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            template: 'passwordReset',
            data: {
                name: user.name,
                resetUrl
            }
        });

        res.json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Error sending reset email'
        });
    }
};

// Сброс пароля
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Проверка токена
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Установка нового пароля
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Отправка уведомления
        await sendEmail({
            email: user.email,
            subject: 'Password Changed Successfully',
            template: 'passwordChanged',
            data: {
                name: user.name
            }
        });

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Получение профиля
const getProfile = async (req, res) => {
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
        logger.error('Get profile error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Обновление профиля
const updateProfile = async (req, res) => {
    try {
        const allowedUpdates = ['name', 'phone', 'location', 'preferences'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid updates provided'
            });
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
        logger.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Изменение пароля
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        // Проверка текущего пароля
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Установка нового пароля
        user.password = newPassword;
        await user.save();

        // Отправка уведомления
        await sendEmail({
            email: user.email,
            subject: 'Password Changed Successfully',
            template: 'passwordChanged',
            data: {
                name: user.name
            }
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Выход
const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            lastActive: new Date()
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
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
};