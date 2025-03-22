const Joi = require('joi');
const mongoose = require('mongoose');

const listingValidators = {
    getListings: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(50),
        sort: Joi.string().valid('newest', 'oldest', 'priceAsc', 'priceDesc', 'popular'),
        category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        city: Joi.string(),
        district: Joi.string(),
        priceMin: Joi.number().min(0),
        priceMax: Joi.number().min(0),
        status: Joi.string().valid('active', 'inactive', 'expired', 'deleted'),
        search: Joi.string().min(2)
    }),

    create: Joi.object({
        title: Joi.object({
            en: Joi.string().required().min(3).max(100),
            ru: Joi.string().required().min(3).max(100),
            el: Joi.string().required().min(3).max(100)
        }).required(),
        
        description: Joi.object({
            en: Joi.string().required().min(10).max(2000),
            ru: Joi.string().required().min(10).max(2000),
            el: Joi.string().required().min(10).max(2000)
        }).required(),
        
        category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        
        price: Joi.object({
            amount: Joi.number().required().min(0),
            currency: Joi.string().required().valid('EUR', 'USD'),
            negotiable: Joi.boolean().default(false)
        }).required(),
        
        location: Joi.object({
            city: Joi.string().required(),
            district: Joi.string(),
            coordinates: Joi.object({
                lat: Joi.number().min(-90).max(90),
                lng: Joi.number().min(-180).max(180)
            })
        }).required()
    }),

    update: Joi.object({
        title: Joi.object({
            en: Joi.string().min(3).max(100),
            ru: Joi.string().min(3).max(100),
            el: Joi.string().min(3).max(100)
        }),
        
        description: Joi.object({
            en: Joi.string().min(10).max(2000),
            ru: Joi.string().min(10).max(2000),
            el: Joi.string().min(10).max(2000)
        }),
        
        price: Joi.object({
            amount: Joi.number().min(0),
            currency: Joi.string().valid('EUR', 'USD'),
            negotiable: Joi.boolean()
        }),
        
        location: Joi.object({
            city: Joi.string(),
            district: Joi.string(),
            coordinates: Joi.object({
                lat: Joi.number().min(-90).max(90),
                lng: Joi.number().min(-180).max(180)
            })
        })
    }),

    checkId: Joi.object({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),

    report: Joi.object({
        reason: Joi.string().required().valid(
            'spam',
            'offensive',
            'inappropriate',
            'fraud',
            'other'
        ),
        description: Joi.string().min(10).max(500).required()
    }),

    updateStatus: Joi.object({
        status: Joi.string().required().valid(
            'active',
            'inactive',
            'expired',
            'deleted',
            'reported'
        )
    })
};

module.exports = {
    listingValidators
};