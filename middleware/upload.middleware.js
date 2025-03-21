const multer = require('multer');
const sharp = require('sharp');
const { uploads, cloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Конфигурация для разных типов загрузок
const UPLOAD_CONFIGS = {
    listing: {
        maxCount: 10,
        minCount: 1,
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        dimensions: {
            minWidth: 800,
            minHeight: 600,
            maxWidth: 4096,
            maxHeight: 4096
        }
    },
    category: {
        maxCount: 1,
        minCount: 1,
        maxSize: 2 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        dimensions: {
            minWidth: 200,
            minHeight: 200,
            maxWidth: 800,
            maxHeight: 800
        }
    },
    profile: {
        maxCount: 1,
        minCount: 1,
        maxSize: 1 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        dimensions: {
            minWidth: 200,
            minHeight: 200,
            maxWidth: 1000,
            maxHeight: 1000
        }
    }
};

// Валидация файлов
const validateFile = async (file, config) => {
    // Проверка размера
    if (file.size > config.maxSize) {
        throw new AppError(
            `File ${file.originalname} is too large. Maximum size is ${config.maxSize / 1024 / 1024}MB`,
            400
        );
    }

    // Проверка типа
    if (!config.allowedTypes.includes(file.mimetype)) {
        throw new AppError(
            `Invalid file type. Allowed types are: ${config.allowedTypes.join(', ')}`,
            400
        );
    }

    // Проверка размеров изображения
    const metadata = await sharp(file.buffer).metadata();
    
    if (metadata.width < config.dimensions.minWidth || 
        metadata.height < config.dimensions.minHeight) {
        throw new AppError(
            `Image dimensions too small. Minimum size is ${config.dimensions.minWidth}x${config.dimensions.minHeight}px`,
            400
        );
    }

    if (metadata.width > config.dimensions.maxWidth || 
        metadata.height > config.dimensions.maxHeight) {
        throw new AppError(
            `Image dimensions too large. Maximum size is ${config.dimensions.maxWidth}x${config.dimensions.maxHeight}px`,
            400
        );
    }
};

// Обработка изображений
const processImage = async (file, type) => {
    const config = UPLOAD_CONFIGS[type];
    let processedBuffer;

    switch (type) {
        case 'listing':
            processedBuffer = await sharp(file.buffer)
                .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85, progressive: true });
            break;

        case 'category':
            processedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'cover' })
                .jpeg({ quality: 90 });
            break;

        case 'profile':
            processedBuffer = await sharp(file.buffer)
                .resize(400, 400, { fit: 'cover' })
                .jpeg({ quality: 90 });
            break;

        default:
            processedBuffer = sharp(file.buffer);
    }

    return processedBuffer.toBuffer();
};

// Создаем middleware для загрузки
const createUploadMiddleware = (type) => {
    const config = UPLOAD_CONFIGS[type];
    const isMultiple = config.maxCount > 1;

    return async (req, res, next) => {
        try {
            // Применяем загрузку через multer
            await new Promise((resolve, reject) => {
                const upload = isMultiple ? 
                    uploads[type].array('images', config.maxCount) :
                    uploads[type].single('image');

                upload(req, res, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            // Проверяем наличие файлов
            const files = isMultiple ? req.files : [req.file];
            
            if (!files || files.length < config.minCount) {
                throw new AppError(
                    `Please upload at least ${config.minCount} image(s)`,
                    400
                );
            }

            // Валидация и обработка каждого файла
            const processedFiles = await Promise.all(files.map(async (file, index) => {
                // Валидация
                await validateFile(file, config);

                // Обработка
                const processedBuffer = await processImage(file, type);

                return {
                    ...file,
                    buffer: processedBuffer,
                    order: index
                };
            }));

            // Загрузка в Cloudinary
            const uploadedFiles = await Promise.all(processedFiles.map(async (file, index) => {
                const result = await cloudinary.uploader.upload(file.buffer, {
                    folder: `cyprus-classified/${type}s`,
                    resource_type: 'auto'
                });

                return {
                    url: result.secure_url,
                    public_id: result.public_id,
                    main: index === 0,
                    order: index,
                    metadata: {
                        size: file.size,
                        mimetype: file.mimetype,
                        originalName: file.originalname,
                        width: result.width,
                        height: result.height
                    }
                };
            }));

            // Добавляем результат в req.body
            if (isMultiple) {
                req.body.images = uploadedFiles;
            } else {
                req.body.image = uploadedFiles[0];
            }

            next();
        } catch (error) {
            // Логируем ошибку
            logger.error('Upload error:', error);

            // Очищаем загруженные файлы в случае ошибки
            if (req.body.images) {
                await Promise.all(
                    req.body.images.map(img => 
                        cloudinary.uploader.destroy(img.public_id)
                    )
                );
            }

            next(error);
        }
    };
};

// Экспортируем middleware для разных типов загрузок
module.exports = {
    handleListingImages: createUploadMiddleware('listing'),
    handleCategoryImage: createUploadMiddleware('category'),
    handleProfileAvatar: createUploadMiddleware('profile')
};