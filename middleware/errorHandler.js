const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Функция для форматирования ошибки
    const formatError = (err) => {
        if (process.env.NODE_ENV === 'development') {
            return {
                success: false,
                status: err.status,
                message: err.message,
                stack: err.stack,
                error: err
            };
        }
        
        return {
            success: false,
            status: err.status,
            message: err.message
        };
    };

    // Обработка специфических ошибок
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({
            success: false,
            status: 'fail',
            error: 'Validation Error',
            details: errors
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            status: 'fail',
            error: 'Duplicate Field Error',
            message: `${field} already exists`
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            status: 'fail',
            error: 'Invalid ID',
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            status: 'fail',
            error: 'Invalid Token',
            message: 'Please log in again'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            status: 'fail',
            error: 'Token Expired',
            message: 'Your token has expired. Please log in again'
        });
    }

    // Логирование ошибки
    console.error('ERROR 💥:', err);

    // Отправка ответа
    res.status(err.statusCode).json(formatError(err));
};

module.exports = errorHandler;