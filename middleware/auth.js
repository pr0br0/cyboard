const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/AppError.js');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new AppError('Authentication required', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ 
            _id: decoded._id,
            'tokens.token': token 
        });

        if (!user) {
            throw new AppError('Authentication required', 401);
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        next(new AppError('Authentication required', 401));
    }
};

const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Not authorized to access this route', 403));
        }
        next();
    };
};

module.exports = {
    auth,
    checkRole
};