// #filename=utils/validators.js#
const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/user.model');

const authValidator = {
    register: [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .custom(async (value) => {
                const user = await User.findOne({ email: value });
                if (user) {
                    throw new Error('Email already exists');
                }
                return true;
            }),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long'),
        body('name')
            .notEmpty()
            .withMessage('Name is required'),
        body('phone.number')
            .optional()
            .isMobilePhone()
            .withMessage('Please enter a valid phone number')
    ],

    login: [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],

    updateProfile: [
        body('name')
            .optional()
            .isLength({ min: 2 })
            .withMessage('Name must be at least 2 characters long'),
        body('phone.number')
            .optional()
            .isMobilePhone()
            .withMessage('Please enter a valid phone number')
    ],

    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('New password must be at least 8 characters long')
    ],

    forgotPassword: [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email')
    ],

    resetPassword: [
        body('token')
            .notEmpty()
            .withMessage('Token is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
    ],

    verifyPhone: [
        body('code')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Please enter a valid verification code')
    ]
};

// Category validation
const categoryValidator = {
    getCategories: [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be at least 1'),
        query('sort')
            .optional()
            .isIn(['name', 'order', 'createdAt', '-name', '-order', '-createdAt'])
            .withMessage('Sort field is invalid')
    ],
    
    getCategory: [
        param('identifier')
            .notEmpty()
            .withMessage('Category identifier is required')
    ],
    
    createCategory: [
        body('name')
            .notEmpty()
            .withMessage('Category name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Category name must be between 2 and 50 characters'),
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot be more than 500 characters'),
        body('parent')
            .optional()
            .isMongoId()
            .withMessage('Parent category must be a valid ID'),
        body('order')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Order must be a non-negative integer')
    ],
    
    updateCategory: [
        param('id')
            .isMongoId()
            .withMessage('Category ID must be valid'),
        body('name')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('Category name must be between 2 and 50 characters'),
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot be more than 500 characters'),
        body('parent')
            .optional()
            .isMongoId()
            .withMessage('Parent category must be a valid ID'),
        body('order')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Order must be a non-negative integer')
    ],
    
    deleteCategory: [
        param('id')
            .isMongoId()
            .withMessage('Category ID must be valid')
    ],
    
    updateOrder: [
        body('categories')
            .isArray()
            .withMessage('Categories must be an array'),
        body('categories.*.id')
            .isMongoId()
            .withMessage('Category ID must be valid'),
        body('categories.*.order')
            .isInt({ min: 0 })
            .withMessage('Order must be a non-negative integer')
    ]
};

// Middleware для валидации
const validate = (validations) => {
    return async (req, res, next) => {
        for (let validation of validations) {
            const result = await validation.run(req);
            if (result.errors.length) break;
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array()
        });
    };
};

module.exports = {
    authValidator,
    categoryValidator,
    validate
};