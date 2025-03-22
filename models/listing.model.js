const mongoose = require('mongoose');
const slugify = require('slugify');

const listingSchema = new mongoose.Schema({
    title: {
        en: { type: String, required: true, minlength: 10, maxlength: 100 },
        ru: { type: String, required: true, minlength: 10, maxlength: 100 },
        el: { type: String, required: true, minlength: 10, maxlength: 100 }
    },
    slug: {
        type: String,
        required: true
    },
    description: {
        en: { type: String, required: true, minlength: 50, maxlength: 5000 },
        ru: { type: String, required: true, minlength: 50, maxlength: 5000 },
        el: { type: String, required: true, minlength: 50, maxlength: 5000 }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        amount: { 
            type: Number, 
            required: true,
            min: 0,
            max: 999999999
        },
        currency: { 
            type: String, 
            enum: ['EUR', 'USD'], 
            required: true 
        },
        negotiable: { 
            type: Boolean, 
            default: false 
        }
    },
    location: {
        city: { 
            type: String, 
            required: true
        },
        district: { 
            type: String, 
            required: true
        },
        address: { 
            type: String, 
            required: true 
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    },
    images: [{
        url: String,
        public_id: String,
        main: { 
            type: Boolean, 
            default: false 
        },
        order: { 
            type: Number, 
            default: 0 
        }
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'expired', 'rejected'],
        default: 'pending'
    },
    views: {
        total: { 
            type: Number, 
            default: 0 
        },
        unique: [String]
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Определяем все индексы в одном месте
listingSchema.index({ slug: 1 }, { unique: true });
listingSchema.index({ category: 1 });
listingSchema.index({ author: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ expiresAt: 1 });
listingSchema.index({ 'location.city': 1 });
listingSchema.index({ 'location.district': 1 });
listingSchema.index({ 'location.coordinates': '2dsphere' });
listingSchema.index({ 
    'title.en': 'text', 
    'title.ru': 'text', 
    'title.el': 'text',
    'description.en': 'text', 
    'description.ru': 'text', 
    'description.el': 'text'
});

// Составные индексы
listingSchema.index({ status: 1, expiresAt: 1 });
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ author: 1, status: 1 });

// ... остальной код модели остается без изменений ...

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;