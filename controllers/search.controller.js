const searchService = require('../services/search.service');
const AppError = require('../utils/AppError');

const search = async (req, res, next) => {
    try {
        const result = await searchService.search(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(new AppError('Error performing search', 500));
    }
};

const suggest = async (req, res, next) => {
    try {
        const { query, lang } = req.query;
        const suggestions = await searchService.suggest(query, lang);
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        next(new AppError('Error getting suggestions', 500));
    }
};

const getPopularSearches = async (req, res, next) => {
    try {
        const { lang } = req.query;
        const popular = await searchService.getPopularSearches(lang);
        res.json({
            success: true,
            data: popular
        });
    } catch (error) {
        next(new AppError('Error getting popular searches', 500));
    }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await searchService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(new AppError('Error getting search stats', 500));
    }
};

module.exports = {
    search,
    suggest,
    getPopularSearches,
    getStats
};