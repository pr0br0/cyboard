const Joi = require('joi');

// Common validation rules
const passwordRules = Joi.string()
  .min(8)
  .max(30)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
  .message('Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character');

const emailRules = Joi.string()
  .email()
  .required()
  .message('Valid email address is required');

const phoneRules = Joi.object({
  number: Joi.string()
    .pattern(new RegExp('^\\+[0-9]{6,15}$'))
    .required()
    .message('Phone number must be in international format (e.g., +35799123456)'),
  countryCode: Joi.string().default('CY')
});

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         name:
 *           type: string
 *         phone:
 *           type: object
 *           properties:
 *             number:
 *               type: string
 *             countryCode:
 *               type: string
 */
const registerSchema = Joi.object({
  email: emailRules,
  password: passwordRules,
  name: Joi.string().min(2).max(50).required(),
  phone: phoneRules.required()
});

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 */
const loginSchema = Joi.object({
  email: emailRules,
  password: Joi.string().required()
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 */
const resetPasswordRequestSchema = Joi.object({
  email: emailRules
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *         newPassword:
 *           type: string
 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: passwordRules
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  changePasswordSchema
}; 