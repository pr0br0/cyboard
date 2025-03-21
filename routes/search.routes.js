const express = require('express');
const router = express.Router();
const { validate, searchValidator } = require('../utils/validators');
const {
    search,
    suggest,
    getPopularSearches,
    getStats
} = require('../controllers/search.controller');

router.get('/listings', validate(searchValidator), search);
router.get('/suggest', suggest);
router.get('/popular', getPopularSearches);
router.get('/stats', getStats);

module.exports = router;