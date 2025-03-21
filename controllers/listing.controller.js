const Listing = require('../models/listing.model');
const User = require('../models/user.model');
const { cloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const { validateObjectId } = require('../utils/validators');

// Получить все объявления с пагинацией и фильтрацией
const getListings = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Построение фильтра
        const filter = {};
        
        // Фильтр по категории
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Фильтр по цене
        if (req.query.minPrice || req.query.maxPrice) {
            filter['price.amount'] = {};
            if (req.query.minPrice) filter['price.amount'].$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filter['price.amount'].$lte = parseFloat(req.query.maxPrice);
        }

        // Фильтр по локации
        if (req.query.city) {
            filter['location.city'] = req.query.city;
        }

        // Поиск по тексту
        if (req.query.search) {
            filter.$or = [
                { 'title.en': { $regex: req.query.search, $options: 'i' } },
                { 'title.ru': { $regex: req.query.search, $options: 'i' } },
                { 'description.en': { $regex: req.query.search, $options: 'i' } },
                { 'description.ru': { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Только активные объявления для обычных пользователей
        if (!req.user?.role === 'admin') {
            filter.status = 'active';
            filter.expiresAt = { $gt: new Date() };
        }

        // Сортировка
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            priceAsc: { 'price.amount': 1 },
            priceDesc: { 'price.amount': -1 },
            popular: { 'views.total': -1 }
        };
        const sort = sortOptions[req.query.sort] || sortOptions.newest;

        const listings = await Listing.find(filter)
            .populate('category', 'name slug')
            .populate('author', 'name email phone')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Listing.countDocuments(filter);

        res.json({
            success: true,
            data: listings,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                perPage: limit
            }
        });
    } catch (error) {
        next(new AppError('Error fetching listings', 500));
    }
};

// Получить объявление по ID
const getListingById = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('category', 'name slug')
            .populate('author', 'name email phone')
            .lean();
        
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        // Проверяем доступ к неактивным объявлениям
        if (listing.status !== 'active' && 
            (!req.user || 
            (req.user._id.toString() !== listing.author._id.toString() && 
            req.user.role !== 'admin'))) {
            return next(new AppError('Listing not found', 404));
        }

        // Увеличиваем счетчик просмотров
        const clientIP = req.ip;
        if (!listing.views.unique.includes(clientIP)) {
            await Listing.findByIdAndUpdate(req.params.id, {
                $inc: { 'views.total': 1 },
                $push: { 'views.unique': clientIP }
            });
            listing.views.total += 1;
        }

        res.json({
            success: true,
            data: listing
        });
    } catch (error) {
        next(new AppError('Error fetching listing', 500));
    }
};

// Создать новое объявление
const createListing = async (req, res, next) => {
    try {
        if (!req.body.images || req.body.images.length === 0) {
            return next(new AppError('At least one image is required', 400));
        }

        const listingData = {
            ...req.body,
            author: req.user._id,
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
            views: { total: 0, unique: [] }
        };

        const listing = await Listing.create(listingData);

        await User.findByIdAndUpdate(req.user._id, {
            $push: { listings: listing._id }
        });

        const populatedListing = await Listing.findById(listing._id)
            .populate('category', 'name slug')
            .populate('author', 'name email phone');

        res.status(201).json({
            success: true,
            data: populatedListing
        });
    } catch (error) {
        // Удаляем загруженные изображения в случае ошибки
        if (req.body.images) {
            for (const image of req.body.images) {
                await cloudinary.uploader.destroy(image.public_id);
            }
        }
        next(new AppError(error.message, 400));
    }
};

// Обновить объявление
const updateListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (listing.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to update this listing', 403));
        }

        // Если есть новые изображения, добавляем их к существующим
        if (req.body.images) {
            req.body.images = [...listing.images, ...req.body.images];
        }

        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('category author');

        res.json({
            success: true,
            data: updatedListing
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Удалить объявление
const deleteListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (listing.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to delete this listing', 403));
        }

        // Удаляем все изображения из Cloudinary
        for (const image of listing.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }

        // Удаляем объявление из списка объявлений пользователя
        await User.findByIdAndUpdate(listing.author, {
            $pull: { listings: listing._id }
        });

        // Удаляем объявление из избранного у всех пользователей
        await User.updateMany(
            { favorites: listing._id },
            { $pull: { favorites: listing._id } }
        );

        await listing.deleteOne();

        res.json({
            success: true,
            message: 'Listing deleted successfully'
        });
    } catch (error) {
        next(new AppError('Error deleting listing', 500));
    }
};

// Обновить изображения объявления
const updateListingImages = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (listing.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to update images', 403));
        }

        if (!req.body.images || req.body.images.length === 0) {
            return next(new AppError('No images provided', 400));
        }

        // Добавляем новые изображения
        const newImages = req.body.images.map((image, index) => ({
            ...image,
            order: listing.images.length + index
        }));

        listing.images.push(...newImages);
        await listing.save();

        res.json({
            success: true,
            data: listing.images
        });
    } catch (error) {
        // Удаляем загруженные изображения в случае ошибки
        if (req.body.images) {
            for (const image of req.body.images) {
                await cloudinary.uploader.destroy(image.public_id);
            }
        }
        next(new AppError('Error updating images', 500));
    }
};

// Удалить изображение из объявления
const deleteListingImage = async (req, res, next) => {
    try {
        const { listingId, imageId } = req.params;
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (listing.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to delete images', 403));
        }

        const image = listing.images.id(imageId);
        if (!image) {
            return next(new AppError('Image not found', 404));
        }

        // Проверяем, не является ли это последним изображением
        if (listing.images.length === 1) {
            return next(new AppError('Cannot delete the last image', 400));
        }

        // Удаляем изображение из Cloudinary
        await cloudinary.uploader.destroy(image.public_id);

        // Удаляем изображение из базы данных
        listing.images.pull(imageId);

        // Если удалили главное изображение, делаем первое изображение главным
        if (image.main) {
            listing.images[0].main = true;
        }

        await listing.save();

        res.json({
            success: true,
            message: 'Image deleted successfully',
            data: listing.images
        });
    } catch (error) {
        next(new AppError('Error deleting image', 500));
    }
};

// Изменить порядок изображений
const reorderListingImages = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const { imageOrder } = req.body;

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (listing.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to reorder images', 403));
        }

        // Проверяем, что все ID изображений существуют
        const validImageIds = listing.images.map(img => img._id.toString());
        const isValidOrder = imageOrder.every(id => validImageIds.includes(id));

        if (!isValidOrder) {
            return next(new AppError('Invalid image IDs provided', 400));
        }

        // Переупорядочиваем изображения
        const reorderedImages = imageOrder.map((id, index) => {
            const image = listing.images.id(id);
            return {
                ...image.toObject(),
                order: index
            };
        });

        listing.images = reorderedImages;
        await listing.save();

        res.json({
            success: true,
            data: listing.images
        });
    } catch (error) {
        next(new AppError('Error reordering images', 500));
    }
};

// Установить главное изображение
const setMainImage = async (req, res, next) => {
    try {
        const { listingId, imageId } = req.params;
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (listing.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to modify images', 403));
        }

        // Сбрасываем флаг main у всех изображений
        listing.images.forEach(img => {
            img.main = img._id.toString() === imageId;
        });

        await listing.save();

        res.json({
            success: true,
            message: 'Main image updated successfully',
            data: listing.images
        });
    } catch (error) {
        next(new AppError('Error setting main image', 500));
    }
};

// Получить объявления пользователя
const getUserListings = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const userId = req.params.userId;
        const filter = { author: userId };

        // Если не админ и не владелец, показываем только активные
        if (req.user?._id.toString() !== userId && req.user?.role !== 'admin') {
            filter.status = 'active';
            filter.expiresAt = { $gt: new Date() };
        }

        const listings = await Listing.find(filter)
            .populate('category', 'name slug')
            .populate('author', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Listing.countDocuments(filter);

        res.json({
            success: true,
            data: listings,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                perPage: limit
            }
        });
    } catch (error) {
        next(new AppError('Error fetching user listings', 500));
    }
};

// Добавить/удалить из избранного
const toggleFavorite = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        const user = await User.findById(req.user._id);
        const isFavorite = user.favorites.includes(listing._id);

        if (isFavorite) {
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { favorites: listing._id }
            });
        } else {
            await User.findByIdAndUpdate(req.user._id, {
                $push: { favorites: listing._id }
            });
        }

        res.json({
            success: true,
            message: isFavorite ? 'Removed from favorites' : 'Added to favorites'
        });
    } catch (error) {
        next(new AppError('Error toggling favorite', 500));
    }
};

// Получить избранные объявления
const getFavoriteListings = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const user = await User.findById(req.user._id)
            .populate({
                path: 'favorites',
                match: { status: 'active', expiresAt: { $gt: new Date() } },
                populate: [
                    { path: 'category', select: 'name slug' },
                    { path: 'author', select: 'name email phone' }
                ],
                options: {
                    skip,
                    limit,
                    sort: { createdAt: -1 }
                }
            })
            .lean();

        const total = user.favorites.length;

        res.json({
            success: true,
            data: user.favorites,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                perPage: limit
            }
        });
    } catch (error) {
        next(new AppError('Error fetching favorite listings', 500));
    }
};

// Пожаловаться на объявление
const reportListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        const report = {
            user: req.user._id,
            reason: req.body.reason,
            description: req.body.description,
            createdAt: new Date()
        };

        listing.reports.push(report);
        await listing.save();

        res.json({
            success: true,
            message: 'Report submitted successfully'
        });
    } catch (error) {
        next(new AppError('Error submitting report', 500));
    }
};

// Продлить срок действия объявления
const extendListingExpiration = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        if (listing.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to extend this listing', 403));
        }

        listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 дней
        await listing.save();

        res.json({
            success: true,
            message: 'Listing extended successfully',
            data: {
                expiresAt: listing.expiresAt
            }
        });
    } catch (error) {
        next(new AppError('Error extending listing', 500));
    }
};

// Обновить статус объявления (для админов)
const updateListingStatus = async (req, res, next) => {
    try {
        const listing = await Listing.findByIdAndUpdate(
            req.params.id,
            { 
                status: req.body.status,
                statusNote: req.body.note
            },
            { new: true, runValidators: true }
        ).populate('category author');

        if (!listing) {
            return next(new AppError('Listing not found', 404));
        }

        res.json({
            success: true,
            data: listing
        });
    } catch (error) {
        next(new AppError('Error updating listing status', 500));
    }
};

module.exports = {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    updateListingImages,
    deleteListingImage,
    reorderListingImages,
    setMainImage,
    getUserListings,
    toggleFavorite,
    getFavoriteListings,
    reportListing,
    extendListingExpiration,
    updateListingStatus
};