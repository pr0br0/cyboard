// scripts/rebuild-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');

async function rebuildIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const collection = mongoose.connection.collection('listings');

        // Получаем список всех существующих индексов
        console.log('Getting existing indexes...');
        const existingIndexes = await collection.indexes();
        console.log('Existing indexes:', existingIndexes.map(i => i.name));

        // Удаляем все индексы, кроме _id
        console.log('Dropping existing indexes...');
        for (const index of existingIndexes) {
            if (index.name !== '_id_') {
                try {
                    await collection.dropIndex(index.name);
                    console.log(`Dropped index: ${index.name}`);
                } catch (error) {
                    console.log(`Error dropping index ${index.name}:`, error.message);
                }
            }
        }

        // Даем MongoDB время на удаление индексов
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Создаем новые индексы
        console.log('Creating new indexes...');

        const indexOperations = [
            {
                key: { slug: 1 },
                options: {
                    name: 'listing_slug_unique',
                    unique: true,
                    sparse: true
                }
            },
            {
                key: { category: 1 },
                options: { name: 'listing_category_index' }
            },
            {
                key: { author: 1 },
                options: { name: 'listing_author_index' }
            },
            {
                key: { status: 1 },
                options: { name: 'listing_status_index' }
            },
            {
                key: { expiresAt: 1 },
                options: { name: 'listing_expires_index' }
            },
            {
                key: { 'location.city': 1, 'location.district': 1 },
                options: { name: 'listing_location_index' }
            },
            {
                key: { 'price.amount': 1, 'price.currency': 1 },
                options: { name: 'listing_price_index' }
            },
            {
                key: { createdAt: -1, status: 1 },
                options: { name: 'listing_created_status_index' }
            }
        ];

        // Создаем индексы последовательно
        for (const { key, options } of indexOperations) {
            try {
                await collection.createIndex(key, options);
                console.log(`Created index: ${options.name}`);
            } catch (error) {
                console.error(`Error creating index ${options.name}:`, error.message);
            }
        }

        // Создаем текстовый индекс
        try {
            await collection.createIndex(
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
            console.log('Created text search index');
        } catch (error) {
            console.error('Error creating text search index:', error.message);
        }

        console.log('Indexes rebuilt successfully');
        
        // Выводим финальный список индексов
        const finalIndexes = await collection.indexes();
        console.log('Final indexes:', finalIndexes.map(i => i.name));
        
        process.exit(0);
    } catch (error) {
        console.error('Error rebuilding indexes:', error);
        process.exit(1);
    }
}

rebuildIndexes();