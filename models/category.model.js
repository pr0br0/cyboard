const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
    name: {
        en: { type: String, required: true },
        ru: { type: String, required: true }
    },
    slug: {
        type: String,
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    ancestors: [{
        _id: mongoose.Schema.Types.ObjectId,
        name: {
            en: String,
            ru: String
        },
        slug: String
    }],
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        title: {
            en: String,
            ru: String
        },
        description: {
            en: String,
            ru: String
        }
    },
    image: {
        url: String,
        public_id: String
    },
    listingCount: {
        type: Number,
        default: 0
    },
    totalListings: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Индексы
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ 'name.en': 'text', 'name.ru': 'text' });
categorySchema.index({ 'ancestors._id': 1 });

// Виртуальные поля
categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

categorySchema.virtual('listings', {
    ref: 'Listing',
    localField: '_id',
    foreignField: 'category'
});

categorySchema.virtual('hasChildren').get(function() {
    return this.children && this.children.length > 0;
});

categorySchema.virtual('level').get(function() {
    return this.ancestors.length;
});

categorySchema.virtual('path').get(function() {
    return [...this.ancestors.map(a => a.slug), this.slug].join('/');
});

// Middleware
categorySchema.pre('save', async function(next) {
    if (this.isModified('name.en')) {
        this.slug = slugify(this.name.en, { 
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });
    }

    if (this.parent && this.isModified('parent')) {
        const parent = await this.constructor.findById(this.parent);
        if (parent) {
            // Проверка на циклические ссылки
            if (parent.ancestors.some(a => a._id.equals(this._id))) {
                throw new Error('Circular reference detected in category hierarchy');
            }

            this.ancestors = [...parent.ancestors, {
                _id: parent._id,
                name: parent.name,
                slug: parent.slug
            }];
        }
    } else {
        this.ancestors = [];
    }

    // Автоматическое обновление метаданных
    if (!this.metadata.title) {
        this.metadata.title = {
            en: this.name.en,
            ru: this.name.ru
        };
    }

    next();
});

// Методы экземпляра
categorySchema.methods.updateListingCount = async function() {
    const [activeCount, totalCount] = await Promise.all([
        mongoose.model('Listing').countDocuments({
            category: this._id,
            status: 'active',
            expiresAt: { $gt: new Date() }
        }),
        mongoose.model('Listing').countDocuments({
            category: this._id
        })
    ]);

    this.listingCount = activeCount;
    this.totalListings = totalCount;
    await this.save();
    return { activeCount, totalCount };
};

categorySchema.methods.getSubcategories = async function() {
    return await this.constructor.find({
        'ancestors._id': this._id
    });
};

categorySchema.methods.getAllListings = async function(options = {}) {
    const subcategories = await this.getSubcategories();
    const categoryIds = [this._id, ...subcategories.map(cat => cat._id)];

    const query = {
        category: { $in: categoryIds }
    };

    if (options.activeOnly) {
        query.status = 'active';
        query.expiresAt = { $gt: new Date() };
    }

    return await mongoose.model('Listing').find(query)
        .populate('author', 'name email')
        .sort(options.sort || { createdAt: -1 });
};

categorySchema.methods.move = async function(newParentId) {
    const oldParent = this.parent;
    this.parent = newParentId;
    await this.save();

    // Обновляем все подкатегории
    const subcategories = await this.getSubcategories();
    for (const subcat of subcategories) {
        await subcat.updateAncestors();
    }

    return this;
};

categorySchema.methods.updateAncestors = async function() {
    if (this.parent) {
        const parent = await this.constructor.findById(this.parent);
        if (parent) {
            this.ancestors = [...parent.ancestors, {
                _id: parent._id,
                name: parent.name,
                slug: parent.slug
            }];
            await this.save();
        }
    }
};

// Статические методы
categorySchema.statics.getTree = async function(options = {}) {
    const query = options.activeOnly ? { isActive: true } : {};
    
    const categories = await this.find(query)
        .populate({
            path: 'children',
            match: query,
            populate: {
                path: 'children',
                match: query
            }
        })
        .sort('order');

    return categories.filter(cat => !cat.parent);
};

categorySchema.statics.findBySlug = async function(slug, options = {}) {
    const query = { slug };
    if (options.activeOnly) {
        query.isActive = true;
    }
    
    return await this.findOne(query)
        .populate(options.populate || '');
};

categorySchema.statics.updateAllListingCounts = async function() {
    const categories = await this.find();
    const updates = categories.map(cat => cat.updateListingCount());
    return await Promise.all(updates);
};

categorySchema.statics.getPopular = async function(limit = 10) {
    return await this.find({ isActive: true })
        .sort('-listingCount')
        .limit(limit);
};

categorySchema.statics.search = async function(query, options = {}) {
    const searchQuery = {
        $or: [
            { 'name.en': { $regex: query, $options: 'i' } },
            { 'name.ru': { $regex: query, $options: 'i' } }
        ]
    };

    if (options.activeOnly) {
        searchQuery.isActive = true;
    }

    return await this.find(searchQuery)
        .sort('order')
        .limit(options.limit || 10);
};

// Хуки для поддержки целостности данных
categorySchema.pre('remove', async function(next) {
    // Проверяем наличие подкатегорий
    const hasChildren = await this.constructor.exists({ parent: this._id });
    if (hasChildren) {
        throw new Error('Cannot delete category with subcategories');
    }

    // Проверяем наличие активных объявлений
    const hasListings = await mongoose.model('Listing').exists({
        category: this._id,
        status: 'active'
    });
    if (hasListings) {
        throw new Error('Cannot delete category with active listings');
    }

    // Удаляем изображение из Cloudinary если есть
    if (this.image && this.image.public_id) {
        const cloudinary = require('cloudinary').v2;
        await cloudinary.uploader.destroy(this.image.public_id);
    }

    next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;