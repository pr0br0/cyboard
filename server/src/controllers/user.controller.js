const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const { validationResult } = require('express-validator');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get user's listings
// @route   GET /api/users/listings
// @access  Private
exports.getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user.id })
      .sort('-createdAt')
      .populate('owner', 'firstName lastName email phone');

    res.json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting user listings',
      error: error.message
    });
  }
};

// @desc    Get user's saved listings
// @route   GET /api/users/saved-listings
// @access  Private
exports.getSavedListings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedListings',
      populate: {
        path: 'owner',
        select: 'firstName lastName email phone'
      }
    });

    res.json({
      success: true,
      count: user.savedListings.length,
      data: user.savedListings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting saved listings',
      error: error.message
    });
  }
};

// @desc    Save/unsave a listing
// @route   PUT /api/users/saved-listings/:id
// @access  Private
exports.toggleSavedListing = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const listingIndex = user.savedListings.indexOf(req.params.id);

    if (listingIndex === -1) {
      user.savedListings.push(req.params.id);
    } else {
      user.savedListings.splice(listingIndex, 1);
    }

    await user.save();

    res.json({
      success: true,
      data: user.savedListings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling saved listing',
      error: error.message
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { settings: req.body },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.json({
      success: true,
      data: user.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    // Delete user's listings
    await Listing.deleteMany({ owner: req.user.id });

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }]
    });

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
}; 