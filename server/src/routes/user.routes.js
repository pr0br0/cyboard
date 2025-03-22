const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  getUserListings,
  getSavedListings,
  toggleSavedListing,
  updateSettings,
  deleteAccount
} = require('../controllers/user.controller');

const router = express.Router();

// Validation middleware
const profileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name is required'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  body('location')
    .optional()
    .isIn(['Limassol', 'Nicosia', 'Larnaca', 'Paphos'])
    .withMessage('Please select a valid location'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot be more than 500 characters')
];

const settingsValidation = [
  body('settings.emailNotifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('settings.pushNotifications').optional().isBoolean().withMessage('Push notifications must be a boolean'),
  body('settings.showEmail').optional().isBoolean().withMessage('Show email must be a boolean'),
  body('settings.showPhone').optional().isBoolean().withMessage('Show phone must be a boolean'),
  body('settings.showLocation').optional().isBoolean().withMessage('Show location must be a boolean')
];

// Routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileValidation, updateProfile);
router.get('/listings', protect, getUserListings);
router.get('/saved-listings', protect, getSavedListings);
router.put('/saved-listings/:id', protect, toggleSavedListing);
router.put('/settings', protect, settingsValidation, updateSettings);
router.delete('/account', protect, deleteAccount);

module.exports = router; 