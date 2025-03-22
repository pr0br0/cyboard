const Joi = require('joi');

const listingValidation = {
  create: Joi.object({
    title: Joi.object({
      en: Joi.string().required().min(3).max(100),
      ru: Joi.string().required().min(3).max(100),
      el: Joi.string().required().min(3).max(100)
    }),
    price: Joi.object({
      amount: Joi.number().min(0).required(),
      currency: Joi.string().valid('EUR', 'USD').required(),
      negotiable: Joi.boolean().default(false)
    }).required()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

module.exports = { listingValidation, validate };