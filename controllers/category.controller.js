 
const mongoose = require('mongoose');
const Category = require('../models/category.model');
const Listing = require('../models/listing.model');
const { cloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');

// Получить все категории
const getCategories = async (req, res, next) => {
    try {
        const { format, lang = 'en' } = req.query;

        let categories;
        if (format === 'tree') {
            categories = await Category.getTree();
        } else {
            categories = await Category.find({ isActive: true })
                .populate('parent', 'name slug')
                .sort('order')
                .lean();
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
        next(new AppError('Error fetching categories', 500));
    }
};

// Получить категорию по ID или slug
const getCategory = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const { lang = 'en' } = req.query;

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

        const formattedCategory = {
            ...category.toObject(),
            name: category.name[lang],
            description: category.description?.[lang],
            metadata: {
                title: category.metadata?.title?.[lang],
                description: cat.metadata?.description?.[lang],
                keywords: cat.metadata?.keywords?.[lang]
            },
            children: children.map(child => ({
                ...child,
                name: child.name[lang]
            })),
            listingsCount
        };

        res.json({
            success: true,
            data: formattedCategory
        });
    } catch (error) {
        next(new AppError('Error fetching category', 500));
    }
};

// Создать категорию
const createCategory = async (req, res, next) => {
    try {
        // Проверяем родительскую категорию если указана
        if (req.body.parent) {
            const parentExists = await Category.findById(req.body.parent);
            if (!parentExists) {
                return next(new AppError('Parent category not found', 404));
            }
        }

        // Обрабатываем загруженное изображение если есть
        if (req.file) {
            req.body.image = {
                url: req.file.path,
                public_id: req.file.filename
            };
        }

        const category = await Category.create(req.body);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        // Удаляем загруженное изображение в случае ошибки
        if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename);
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

        // Проверяем, не пытаемся ли мы установить категорию как родителя самой себя
        if (req.body.parent === category._id.toString()) {
            return next(new AppError('Category cannot be its own parent', 400));
        }

        // Проверяем, не пытаемся ли мы установить дочернюю категорию как родителя
        if (req.body.parent) {
            const children = await Category.find({ parent: category._id });
            if (children.some(child => child._id.toString() === req.body.parent)) {
                return next(new AppError('Cannot set child category as parent', 400));
            }
        }

        // Обрабатываем новое изображение если загружено
        if (req.file) {
            // Удаляем старое изображение
            if (category.image?.public_id) {
                await cloudinary.uploader.destroy(category.image.public_id);
            }
            req.body.image = {
                url: req.file.path,
                public_id: req.file.filename
            };
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        // Удаляем загруженное изображение в случае ошибки
        if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        next(new AppError(error.message, 400));
    }
};

// Удалить категорию
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        // Проверяем, есть ли дочерние категории
        const hasChildren = await Category.exists({ parent: category._id });
        if (hasChildren) {
            return next(new AppError('Cannot delete category with subcategories', 400));
        }

        // Проверяем, есть ли активные объявления
        const hasListings = await Listing.exists({ 
            category: category._id,
            status: 'active'
        });
        if (hasListings) {
            return next(new AppError('Cannot delete category with active listings', 400));
        }

        // Удаляем изображение из Cloudinary
        if (category.image?.public_id) {
            await cloudinary.uploader.destroy(category.image.public_id);
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(new AppError('Error deleting category', 500));
    }
};

// Обновить порядок категорий
const updateCategoriesOrder = async (req, res, next) => {
    try {
        const { orders } = req.body;

        const updatePromises = Object.entries(orders).map(([id, order]) =>
            Category.findByIdAndUpdate(id, { order }, { new: true })
        );

        await Promise.all(updatePromises);

        const updatedCategories = await Category.find({
            _id: { $in: Object.keys(orders) }
        }).sort('order');

        res.json({
            success: true,
            data: updatedCategories
        });
    } catch (error) {
        next(new AppError('Error updating categories order', 500));
    }
};

// Обновить счетчики объявлений
const updateListingCounts = async (req, res, next) => {
    try {
        const categories = await Category.find();
        
        const updatePromises = categories.map(category =>
            category.updateListingCount()
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Listing counts updated successfully'
        });
    } catch (error) {
        next(new AppError('Error updating listing counts', 500));
    }
};

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoriesOrder,
    updateListingCounts
};