const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  searchListings
} = require('../controllers/listing.controller');

const router = express.Router();

// Validation middleware
const listingValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category')
    .isIn(['Houses', 'Apartments', 'Land', 'Commercial'])
    .withMessage('Please select a valid category'),
  body('location')
    .isIn(['Limassol', 'Nicosia', 'Larnaca', 'Paphos'])
    .withMessage('Please select a valid location'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('mainImage').notEmpty().withMessage('Main image is required'),
  body('contactInfo.phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  body('contactInfo.email').optional().isEmail().withMessage('Please enter a valid email'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Number of bedrooms must be a positive integer'),
  body('bathrooms').optional().isInt({ min: 0 }).withMessage('Number of bathrooms must be a positive integer'),
  body('area').optional().isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  body('yearBuilt').optional().isInt({ min: 1900 }).withMessage('Please enter a valid year')
];

// Routes
router.post('/', protect, listingValidation, createListing);
router.get('/', getListings);
router.get('/search', searchListings);
router.get('/:id', getListing);
router.put('/:id', protect, listingValidation, updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router; 