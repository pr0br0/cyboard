const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');

// Создаем разные хранилища для разных типов файлов
const createStorage = (folder, options = {}) => {
    return new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `cyprus-classified/${folder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: options.width || 1000, height: options.height || 1000, crop: options.crop || 'limit' },
                { quality: 'auto' }
            ]
        }
    });
};

// Фильтр для проверки файлов
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        cb(new AppError('Only images are allowed', 400), false);
        return;
    }
    cb(null, true);
};

// Создаем разные конфигурации для разных типов загрузок
const uploads = {
    category: multer({
        storage: createStorage('categories', { width: 300, height: 300, crop: 'fill' }),
        fileFilter,
        limits: { fileSize: 2 * 1024 * 1024, files: 1 }
    }),

    listing: multer({
        storage: createStorage('listings'),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024, files: 10 }
    }),

    avatar: multer({
        storage: createStorage('avatars', { width: 200, height: 200, crop: 'fill' }),
        fileFilter,
        limits: { fileSize: 1 * 1024 * 1024, files: 1 }
    })
};

// Обработчик ошибок загрузки
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File is too large', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('Too many files', 400));
        }
    }
    next(err);
};

module.exports = {
    uploads,
    handleUploadError
};