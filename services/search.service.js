const Listing = require('../models/listing.model');
const Category = require('../models/category.model');

class SearchService {
    constructor() {
        this.defaultLimit = 10;
        this.maxLimit = 50;
    }

    async search(params) {
        const {
            query,
            category,
            priceMin,
            priceMax,
            location,
            sort,
            page = 1,
            limit = this.defaultLimit,
            lang = 'en'
        } = params;

        // Базовый фильтр
        const filter = {
            status: 'active',
            expiresAt: { $gt: new Date() }
        };

        // Поисковый запрос
        if (query) {
            filter.$or = [
                { [`title.${lang}`]: { $regex: query, $options: 'i' } },
                { [`description.${lang}`]: { $regex: query, $options: 'i' } }
            ];
        }

        // Фильтр по категории
        if (category) {
            const categoryDoc = await Category.findOne({
                $or: [
                    { _id: category },
                    { slug: category }
                ]
            });

            if (categoryDoc) {
                // Получаем все подкатегории
                const subcategories = await Category.find({
                    $or: [
                        { _id: categoryDoc._id },
                        { 'ancestors._id': categoryDoc._id }
                    ]
                }).select('_id');

                filter.category = {
                    $in: subcategories.map(cat => cat._id)
                };
            }
        }

        // Фильтр по цене
        if (priceMin || priceMax) {
            filter['price.amount'] = {};
            if (priceMin) filter['price.amount'].$gte = parseFloat(priceMin);
            if (priceMax) filter['price.amount'].$lte = parseFloat(priceMax);
        }

        // Фильтр по локации
        if (location) {
            if (location.city) {
                filter['location.city'] = location.city;
            }
            if (location.district) {
                filter['location.district'] = location.district;
            }
            if (location.coordinates) {
                filter['location.coordinates'] = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [
                                location.coordinates.longitude,
                                location.coordinates.latitude
                            ]
                        },
                        $maxDistance: location.radius || 5000 // метров
                    }
                };
            }
        }

        // Сортировка
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            priceAsc: { 'price.amount': 1 },
            priceDesc: { 'price.amount': -1 },
            popular: { 'views.total': -1 }
        };

        // Пагинация
        const actualLimit = Math.min(parseInt(limit), this.maxLimit);
        const skip = (parseInt(page) - 1) * actualLimit;

        // Выполнение запроса
        const [listings, total] = await Promise.all([
            Listing.find(filter)
                .populate('category', 'name slug')
                .populate('author', 'name email phone')
                .sort(sortOptions[sort] || sortOptions.newest)
                .skip(skip)
                .limit(actualLimit)
                .lean(),
            Listing.countDocuments(filter)
        ]);

        // Форматирование результатов
        const formattedListings = listings.map(listing => ({
            ...listing,
            title: listing.title[lang],
            description: listing.description[lang],
            category: {
                ...listing.category,
                name: listing.category.name[lang]
            }
        }));

        return {
            listings: formattedListings,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / actualLimit),
                total,
                perPage: actualLimit
            }
        };
    }

    async suggest(query, lang = 'en') {
        if (!query || query.length < 2) return [];

        const suggestions = await Listing.aggregate([
            {
                $match: {
                    status: 'active',
                    expiresAt: { $gt: new Date() },
                    [`title.${lang}`]: { $regex: query, $options: 'i' }
                }
            },
            {
                $group: {
                    _id: `$title.${lang}`,
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        return suggestions.map(s => ({
            text: s._id,
            count: s.count
        }));
    }

    async getPopularSearches(lang = 'en') {
        const searches = await Listing.aggregate([
            {
                $match: {
                    status: 'active',
                    expiresAt: { $gt: new Date() }
                }
            },
            {
                $group: {
                    _id: `$category`,
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            }
        ]);

        return searches.map(s => ({
            category: {
                id: s.category._id,
                name: s.category.name[lang],
                slug: s.category.slug
            },
            count: s.count
        }));
    }

    async getStats() {
        const stats = await Listing.aggregate([
            {
                $match: {
                    status: 'active',
                    expiresAt: { $gt: new Date() }
                }
            },
            {
                $group: {
                    _id: null,
                    totalListings: { $sum: 1 },
                    avgPrice: { $avg: '$price.amount' },
                    minPrice: { $min: '$price.amount' },
                    maxPrice: { $max: '$price.amount' }
                }
            }
        ]);

        return stats[0] || {
            totalListings: 0,
            avgPrice: 0,
            minPrice: 0,
            maxPrice: 0
        };
    }
}

module.exports = new SearchService();