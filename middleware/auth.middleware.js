// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    try {
        // Извлечение токена из заголовка Authorization
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        // Проверка наличия токена
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Please authenticate'
            });
        }

        // Проверка и декодирование токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id, isActive: true });

        // Проверка наличия пользователя
        if (!user) {
            throw new Error('User not found');
        }

        // Сохранение информации о пользователе и токене в объекте запроса
        req.user = user;
        req.token = token;
        next(); // Переход к следующему middleware или маршруту
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Please authenticate'
        });
    }
};

module.exports = auth; // Экспорт middleware