// scripts/rebuild-all-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

async function fixListingSlugs() {
    const listingCollection = mongoose.connection.collection('listings');
    const listings = await listingCollection.find({ $or: [
        { slug: null },
        { slug: { $exists: false } },
        { slug: '' }
    ]}).toArray();

    console.log(`Found ${listings.length} listings without valid slugs`);

    for (const listing of listings) {
        if (listing.title && listing.title.en) {
            const baseSlug = slugify(listing.title.en, {
                lower: true,
                strict: true,
                trim: true
            });
            const uniqueSuffix = Math.random().toString(36).substr(2, 6);
            const newSlug = `${baseSlug}-${uniqueSuffix}`;

            await listingCollection.updateOne(
                { _id: listing._id },
                { $set: { slug: newSlug } }
            );
            console.log(`Updated slug for listing ${listing._id}`);
        } else {
            // Если нет заголовка, удаляем запись
            await listingCollection.deleteOne({ _id: listing._id });
            console.log(`Deleted invalid listing ${listing._id}`);
        }
    }
}

async function rebuildAllIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        // Сначала исправляем slug'и
        console.log('Fixing listing slugs...');
        await fixListingSlugs();

        const collections = await mongoose.connection.db.collections();

        // Удаляем все существующие индексы
        for (const collection of collections) {
            console.log(`Rebuilding indexes for ${collection.collectionName}`);
            
            const indexes = await collection.indexes();
            for (const index of indexes) {
                if (index.name !== '_id_') {
                    await collection.dropIndex(index.name);
                    console.log(`Dropped index: ${index.name}`);
                }
            }
        }

        // Даем MongoDB время на удаление индексов
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Создаем индексы для пользователей
        console.log('Creating user indexes...');
        const userCollection = mongoose.connection.collection('users');
        await userCollection.createIndexes([
            { key: { email: 1 }, unique: true, name: 'user_email_unique' },
            { key: { name: 1 }, name: 'user_name_index' },
            { key: { phone: 1 }, sparse: true, name: 'user_phone_index' },
            { key: { role: 1, isActive: 1 }, name: 'user_role_active_index' },
            { key: { lastLogin: 1 }, name: 'user_last_login_index' },
            { key: { isVerified: 1 }, name: 'user_verified_index' },
            { key: { lockUntil: 1 }, name: 'user_lock_index' }
        ]);

        // Создаем индексы для категорий
        console.log('Creating category indexes...');
        const categoryCollection = mongoose.connection.collection('categories');
        await categoryCollection.createIndexes([
            { key: { slug: 1 }, unique: true, name: 'category_slug_unique' },
            { key: { parent: 1 }, name: 'category_parent_index' },
            { key: { order: 1 }, name: 'category_order_index' }
        ]);

        // Создаем индексы для объявлений
        console.log('Creating listing indexes...');
        const listingCollection = mongoose.connection.collection('listings');
        await listingCollection.createIndexes([
            { key: { slug: 1 }, unique: true, sparse: true, name: 'listing_slug_unique' },
            { key: { category: 1 }, name: 'listing_category_index' },
            { key: { author: 1 }, name: 'listing_author_index' },
            { key: { status: 1 }, name: 'listing_status_index' },
            { key: { expiresAt: 1 }, name: 'listing_expires_index' },
            { key: { 'location.city': 1, 'location.district': 1 }, name: 'listing_location_index' },
            { key: { 'price.amount': 1, 'price.currency': 1 }, name: 'listing_price_index' },
            { key: { createdAt: -1, status: 1 }, name: 'listing_created_status_index' }
        ]);

        // Создаем текстовый индекс для объявлений
        await listingCollection.createIndex(
            {
                'title.en': 'text',
                'title.ru': 'text',
                'title.el': 'text',
                'description.en': 'text',
                'description.ru': 'text',
                'description.el': 'text'
            },
            {
                weights: {
                    'title.en': 10,
                    'title.ru': 10,
                    'title.el': 10,
                    'description.en': 5,
                    'description.ru': 5,
                    'description.el': 5
                },
                name: 'listing_text_search_index'
            }
        );

        console.log('All indexes rebuilt successfully');

        // Выводим все созданные индексы
        for (const collection of collections) {
            const indexes = await collection.indexes();
            console.log(`\nIndexes for ${collection.collectionName}:`);
            indexes.forEach(index => console.log(` - ${index.name}`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error rebuilding indexes:', error);
        process.exit(1);
    }
}

rebuildAllIndexes();