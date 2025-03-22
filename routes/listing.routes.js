const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { auth } = require('../middleware/auth');
const User = require('../models/user.model'); // Добавьте импорт модели User

// Функция для валидации MongoDB ObjectId
const validateObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid ID format', 400);
    }
    return mongoose.Types.ObjectId(id);
};

// Middleware для проверки валидаторов
const validate = (validators) => {
    return async (req, res, next) => {
        await Promise.all(validators.map(validator => validator.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    };
};

// Базовые валидаторы
const checkId = [
    param('id').isMongoId().withMessage('Invalid ID format')
];

// Валидаторы для листингов
const getListingsValidator = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('category').optional().isMongoId().withMessage('Invalid category ID'),
    query('city').optional().isString().trim(),
    query('district').optional().isString().trim(),
    query('status').optional().isIn(['active', 'inactive', 'pending', 'expired']).withMessage('Invalid status'),
    query('priceMin').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    query('priceMax').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    query('sort').optional().isIn(['newest', 'oldest', 'priceAsc', 'priceDesc', 'popular']).withMessage('Invalid sort option'),
    query('search').optional().isString().trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters long')
];

// Placeholder controller functions
const getListings = (req, res) => {
    res.json({ message: 'Get all listings' });
};

const getListing = (req, res) => {
    res.json({ message: 'Get listing by ID' });
};

const createListing = (req, res) => {
    res.json({ message: 'Create listing' });
};

const updateListing = (req, res) => {
    res.json({ message: 'Update listing' });
};

const deleteListing = (req, res) => {
    res.json({ message: 'Delete listing' });
};

// Public routes
router.get('/', validate(getListingsValidator), getListings);
router.get('/:id', validate(checkId), getListing);

// Protected routes
router.use(auth);
router.post('/', createListing);
router.put('/:id', validate(checkId), updateListing);
router.delete('/:id', validate(checkId), deleteListing);

// Валидаторы для категорий
const categoryValidator = {
    getCategories: [
        query('format').optional().isIn(['tree', 'list']),
        query('lang').optional().isIn(['en', 'ru', 'el'])
    ],

    getCategory: [
        param('identifier').notEmpty().withMessage('Identifier is required'),
        query('lang').optional().isIn(['en', 'ru', 'el'])
    ],

    createCategory: [
        body('name.en')
            .notEmpty().withMessage('English name is required')
            .isLength({ max: 100 }).withMessage('Name cannot be more than 100 characters'),
        body('name.ru')
            .notEmpty().withMessage('Russian name is required')
            .isLength({ max: 100 }).withMessage('Name cannot be more than 100 characters'),
        body('name.el')
            .notEmpty().withMessage('Greek name is required')
            .isLength({ max: 100 }).withMessage('Name cannot be more than 100 characters'),
        body('description.en')
            .optional()
            .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
        body('description.ru')
            .optional()
            .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
        body('description.el')
            .optional()
            .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
        body('parent')
            .optional()
            .isMongoId().withMessage('Invalid parent category ID'),
        body('order')
            .optional()
            .isInt({ min: 0 }).withMessage('Order must be a positive number'),
        body('isActive')
            .optional()
            .isBoolean().withMessage('isActive must be a boolean')
    ],

    updateCategory: [
        param('id').isMongoId().withMessage('Invalid category ID'),
        body('name.en')
            .optional()
            .isLength({ max: 100 }).withMessage('Name cannot be more than 100 characters'),
        body('name.ru')
            .optional()
            .isLength({ max: 100 }).withMessage('Name cannot be more than 100 characters'),
        body('name.el')
            .optional()
            .isLength({ max: 100 }).withMessage('Name cannot be more than 100 characters'),
        body('description.en')
            .optional()
            .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
        body('description.ru')
            .optional()
            .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
        body('description.el')
            .optional()
            .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
        body('parent')
            .optional()
            .isMongoId().withMessage('Invalid parent category ID'),
        body('order')
            .optional()
            .isInt({ min: 0 }).withMessage('Order must be a positive number'),
        body('isActive')
            .optional()
            .isBoolean().withMessage('isActive must be a boolean')
    ],

    deleteCategory: [
        param('id').isMongoId().withMessage('Invalid category ID')
    ],

    updateOrder: [
        body('orders')
            .isObject().withMessage('Orders must be an object'),
        body('orders.*')
            .isInt({ min: 0 }).withMessage('Order must be a positive number')
    ]
};

// Валидаторы для аутентификации и пользователей
const authValidator = {
    register: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please enter a valid email')
            .normalizeEmail()
            .custom(async (email) => {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    throw new Error('Email already in use');
                }
                return true;
            }),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/\d/)
            .withMessage('Password must contain a number')
            .matches(/[A-Z]/)
            .withMessage('Password must contain an uppercase letter')
            .matches(/[a-z]/)
            .withMessage('Password must contain a lowercase letter')
            .matches(/[!@#$%^&*]/)
            .withMessage('Password must contain a special character'),
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Name can only contain letters and spaces'),
        body('phone.number')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required')
            .matches(/^\+?[1-9]\d{7,14}$/)
            .withMessage('Please enter a valid phone number')
            .custom(async (phone) => {
                const existingUser = await User.findOne({ 'phone.number': phone });
                if (existingUser) {
                    throw new Error('Phone number already in use');
                }
                return true;
            })
    ],

    login: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please enter a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],

    updateProfile: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Name can only contain letters and spaces'),
        body('phone.number')
            .optional()
            .trim()
            .matches(/^\+?[1-9]\d{7,14}$/)
            .withMessage('Please enter a valid phone number')
            .custom(async (phone, { req }) => {
                const existingUser = await User.findOne({ 
                    'phone.number': phone,
                    _id: { $ne: req.user._id }
                });
                if (existingUser) {
                    throw new Error('Phone number already in use');
                }
                return true;
            }),
        body('location')
            .optional()
            .isObject()
            .withMessage('Location must be an object'),
        body('location.city')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('City must be between 2 and 50 characters'),
        body('location.district')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('District must be between 2 and 50 characters'),
        body('location.coordinates')
            .optional()
            .isArray()
            .withMessage('Coordinates must be an array'),
        body('location.coordinates.*')
            .optional()
            .isFloat()
            .withMessage('Coordinates must be numbers'),
        body('preferences')
            .optional()
            .isObject()
            .withMessage('Preferences must be an object'),
        body('preferences.language')
            .optional()
            .isIn(['en', 'ru', 'el'])
            .withMessage('Invalid language selection'),
        body('preferences.currency')
            .optional()
            .isIn(['EUR', 'USD'])
            .withMessage('Invalid currency selection'),
        body('preferences.notifications')
            .optional()
            .isObject()
            .withMessage('Notifications preferences must be an object'),
        body('preferences.notifications.email')
            .optional()
            .isBoolean()
            .withMessage('Email notification preference must be boolean'),
        body('preferences.notifications.push')
            .optional()
            .isBoolean()
            .withMessage('Push notification preference must be boolean')
    ],

    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/\d/)
            .withMessage('Password must contain a number')
            .matches(/[A-Z]/)
            .withMessage('Password must contain an uppercase letter')
            .matches(/[a-z]/)
            .withMessage('Password must contain a lowercase letter')
            .matches(/[!@#$%^&*]/)
            .withMessage('Password must contain a special character')
            .custom((value, { req }) => {
                if (value === req.body.currentPassword) {
                    throw new Error('New password must be different from current password');
                }
                return true;
            })
    ],

    resetPassword: [
        body('token')
            .notEmpty()
            .withMessage('Reset token is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/\d/)
            .withMessage('Password must contain a number')
            .matches(/[A-Z]/)
            .withMessage('Password must contain an uppercase letter')
            .matches(/[a-z]/)
            .withMessage('Password must contain a lowercase letter')
            .matches(/[!@#$%^&*]/)
            .withMessage('Password must contain a special character')
    ],

    verifyEmail: [
        param('token')
            .notEmpty()
            .withMessage('Verification token is required')
    ],

    verifyPhone: [
        body('code')
            .trim()
            .isLength({ min: 6, max: 6 })
            .withMessage('Verification code must be 6 digits')
            .isNumeric()
            .withMessage('Verification code must contain only numbers')
    ]
};

module.exports = router;