const Category = require('../models/category.model');
const Listing = require('../models/listing.model');
const { cloudinary, imageUtils } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const { cache } = require('../utils/cache');
const logger = require('../utils/logger');

// Ключи кэша
const CACHE_KEYS = {
    ALL_CATEGORIES: 'categories:all',
    CATEGORY_TREE: 'categories:tree',
    CATEGORY_DETAIL: (id) => `category:${id}`,
    CATEGORY_CHILDREN: (id) => `category:${id}:children`
};

// Получить все категории
const getCategories = async (req, res, next) => {
    try {
        const { format, lang = 'en' } = req.query;
        const cacheKey = format === 'tree' ? CACHE_KEYS.CATEGORY_TREE : CACHE_KEYS.ALL_CATEGORIES;

        // Пробуем получить из кэша
        let categories = await cache.get(cacheKey);

        if (!categories) {
            if (format === 'tree') {
                categories = await Category.getTree();
            } else {
                categories = await Category.find({ isActive: true })
                    .populate('parent', 'name slug')
                    .sort('order')
                    .lean();
            }

            // Сохраняем в кэш на 1 час
            await cache.set(cacheKey, categories, 3600);
        }

        // Форматируем ответ в зависимости от языка
        const formattedCategories = categories.map(cat => ({
            ...cat,
            name: cat.name[lang],
            description: cat.description?.[lang],
            metadata: {
                title: cat.metadata?.title?.[lang],
                description: cat.metadata?.description?.[lang],
                keywords: cat.metadata?.keywords?.[lang]
            }
        }));

        res.json({
            success: true,
            data: formattedCategories
        });
    } catch (error) {
        logger.error('Error fetching categories:', error);
        next(new AppError('Error fetching categories', 500));
    }
};

// Получить категорию по ID или slug
const getCategory = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const { lang = 'en' } = req.query;

        // Пробуем получить из кэша
        const cacheKey = CACHE_KEYS.CATEGORY_DETAIL(identifier);
        let categoryData = await cache.get(cacheKey);

        if (!categoryData) {
            let category;
            if (mongoose.Types.ObjectId.isValid(identifier)) {
                category = await Category.findById(identifier);
            } else {
                category = await Category.findOne({ slug: identifier });
            }

            if (!category) {
                return next(new AppError('Category not found', 404));
            }

            // Получаем дочерние категории
            const children = await Category.find({ parent: category._id })
                .select('name slug image icon listingCount')
                .lean();

            // Получаем количество активных объявлений
            const listingsCount = await Listing.countDocuments({
                category: category._id,
                status: 'active',
                expiresAt: { $gt: new Date() }
            });

            categoryData = {
                ...category.toObject(),
                children,
                listingsCount
            };

            // Сохраняем в кэш на 1 час
            await cache.set(cacheKey, categoryData, 3600);
        }

        // Форматируем данные согласно языку
        const formattedCategory = {
            ...categoryData,
            name: categoryData.name[lang],
            description: categoryData.description?.[lang],
            metadata: {
                title: categoryData.metadata?.title?.[lang],
                description: categoryData.metadata?.description?.[lang],
                keywords: categoryData.metadata?.keywords?.[lang]
            },
            children: categoryData.children.map(child => ({
                ...child,
                name: child.name[lang]
            }))
        };

        res.json({
            success: true,
            data: formattedCategory
        });
    } catch (error) {
        logger.error('Error fetching category:', error);
        next(new AppError('Error fetching category', 500));
    }
};

// Создать категорию
const createCategory = async (req, res, next) => {
    try {
        // Проверяем родительскую категорию
        if (req.body.parent) {
            const parentExists = await Category.findById(req.body.parent);
            if (!parentExists) {
                return next(new AppError('Parent category not found', 404));
            }
        }

        const category = await Category.create(req.body);

        // Очищаем кэш категорий
        await Promise.all([
            cache.del(CACHE_KEYS.ALL_CATEGORIES),
            cache.del(CACHE_KEYS.CATEGORY_TREE),
            req.body.parent && cache.del(CACHE_KEYS.CATEGORY_CHILDREN(req.body.parent))
        ]);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Error creating category:', error);
        
        // Удаляем загруженное изображение в случае ошибки
        if (req.body.image?.public_id) {
            await imageUtils.deleteImage(req.body.image.public_id);
        }
        
        next(new AppError(error.message, 400));
    }
};

// Обновить категорию
const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        // Валидация иерархии
        if (req.body.parent) {
            if (req.body.parent === category._id.toString()) {
                return next(new AppError('Category cannot be its own parent', 400));
            }

            const children = await Category.find({ parent: category._id });
            if (children.some(child => child._id.toString() === req.body.parent)) {
                return next(new AppError('Cannot set child category as parent', 400));
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Очищаем кэш
        await Promise.all([
            cache.del(CACHE_KEYS.ALL_CATEGORIES),
            cache.del(CACHE_KEYS.CATEGORY_TREE),
            cache.del(CACHE_KEYS.CATEGORY_DETAIL(category._id)),
            category.parent && cache.del(CACHE_KEYS.CATEGORY_CHILDREN(category.parent)),
            req.body.parent && cache.del(CACHE_KEYS.CATEGORY_CHILDREN(req.body.parent))
        ]);

        res.json({
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        logger.error('Error updating category:', error);
        
        // Удаляем новое изображение в случае ошибки
        if (req.body.image?.public_id) {
            await imageUtils.deleteImage(req.body.image.public_id);
        }
        
        next(new AppError(error.message, 400));
    }
};

// ... остальные методы остаются без изменений ...

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoriesOrder,
    updateListingCounts
};