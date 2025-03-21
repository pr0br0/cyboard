const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { handleCategoryImage } = require('../middleware/upload.middleware');
const { validate, categoryValidator } = require('../utils/validators');
const { cacheMiddleware } = require('../utils/cache');

const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoriesOrder,
    updateListingCounts
} = require('../controllers/category.controller');

// Публичные маршруты с кэшированием
router.get('/', 
    cacheMiddleware(3600), // Кэшируем на 1 час
    validate(categoryValidator.getCategories), 
    getCategories
);

router.get('/:identifier', 
    cacheMiddleware(3600),
    validate(categoryValidator.getCategory), 
    getCategory
);

// Защищенные маршруты (только для админов)
router.use(auth, checkRole('admin'));

// Создание категории с изображением
router.post('/',
    handleCategoryImage, // Специальный middleware для изображений категорий
    validate(categoryValidator.createCategory),
    createCategory
);

// Обновление категории с изображением
router.put('/:id',
    handleCategoryImage,
    validate(categoryValidator.updateCategory),
    updateCategory
);

// Удаление категории
router.delete('/:id',
    validate(categoryValidator.deleteCategory),
    deleteCategory
);

// Обновление порядка категорий
router.put('/order',
    validate(categoryValidator.updateOrder),
    updateCategoriesOrder
);

// Обновление счетчиков
router.post('/update-counts', updateListingCounts);

module.exports = router;