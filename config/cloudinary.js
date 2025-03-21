const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Базовая конфигурация
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Конфигурации для разных типов изображений
const configurations = {
    listing: {
        folder: 'cyprus-classified/listings',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' }
        ]
    },
    thumbnail: {
        folder: 'cyprus-classified/thumbnails',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto' }
        ]
    },
    profile: {
        folder: 'cyprus-classified/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
        ]
    }
};

// Создаем хранилище для разных типов загрузок
const createStorage = (type) => {
    return new CloudinaryStorage({
        cloudinary,
        params: {
            ...configurations[type],
            public_id: (req, file) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                return `${type}-${uniqueSuffix}`;
            }
        }
    });
};

// Валидация файлов
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Только изображения разрешены для загрузки!'), false);
        return;
    }
    cb(null, true);
};

// Создаем различные middleware для разных типов загрузок
const uploads = {
    listing: multer({
        storage: createStorage('listing'),
        fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
            files: 10 // максимум 10 файлов
        }
    }),
    
    thumbnail: multer({
        storage: createStorage('thumbnail'),
        fileFilter,
        limits: {
            fileSize: 2 * 1024 * 1024, // 2MB
            files: 1
        }
    }),
    
    profile: multer({
        storage: createStorage('profile'),
        fileFilter,
        limits: {
            fileSize: 2 * 1024 * 1024, // 2MB
            files: 1
        }
    })
};

// Утилиты для работы с изображениями
const imageUtils = {
    // Генерация URL с трансформацией
    getResizedImageUrl: (originalUrl, width, height, crop = 'fill') => {
        return cloudinary.url(originalUrl, {
            width,
            height,
            crop,
            quality: 'auto'
        });
    },

    // Удаление изображения
    async deleteImage(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            console.error('Ошибка при удалении изображения:', error);
            throw error;
        }
    },

    // Оптимизация изображения
    async optimizeImage(publicId) {
        try {
            const result = await cloudinary.uploader.explicit(publicId, {
                type: 'upload',
                eager: [
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            });
            return result;
        } catch (error) {
            console.error('Ошибка при оптимизации изображения:', error);
            throw error;
        }
    }
};

module.exports = {
    cloudinary,
    uploads,
    imageUtils,
    // Middleware для обработки ошибок загрузки
    handleUploadError: (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Файл слишком большой'
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Превышено максимальное количество файлов'
                });
            }
        }
        if (err.message === 'Только изображения разрешены для загрузки!') {
            return res.status(400).json({
                status: 'error',
                message: err.message
            });
        }
        next(err);
    }
};