const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Middleware factory for request validation using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[property];
    
    if (!schema) {
      logger.error('Validation schema is missing');
      return res.status(500).json({
        status: 'error',
        message: 'Server validation error'
      });
    }
    
    const options = {
      abortEarly: false, // include all errors
      allowUnknown: true, // ignore unknown props
      stripUnknown: true // remove unknown props
    };
    
    const { error, value } = schema.validate(dataToValidate, options);
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        message: detail.message,
        path: detail.path.join('.')
      }));
      
      logger.warn(`Validation error for ${req.method} ${req.originalUrl}`, {
        errors: validationErrors,
        data: dataToValidate
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Replace request data with validated data
    req[property] = value;
    return next();
  };
};

module.exports = {
  validate
}; 