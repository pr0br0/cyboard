require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Category = require('./models/category.model');
const User = require('./models/user.model');
const Listing = require('./models/listing.model');

async function createTestData() {
    try {
        await connectDB();
        console.log('Connected to database');

        // Очищаем существующие данные
        await Promise.all([
            Category.deleteMany({}),
            User.deleteMany({}),
            Listing.deleteMany({})
        ]);
        console.log('Existing data cleared');

        // Создаем тестового пользователя
        const user = await User.create({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            phone: '+35799999999'
        });
        console.log('Test user created:', user.email);

        // Создаем тестовую категорию
        const category = await Category.create({
            name: {
                en: 'Real Estate',
                ru: 'Недвижимость',
                el: 'Ακίνητα'
            },
            slug: 'real-estate'
        });
        console.log('Test category created:', category.name.en);

        // Создаем тестовое объявление
        const listing = await Listing.create({
            title: {
                en: 'Test Listing',
                ru: 'Тестовое объявление',
                el: 'Δοκιμαστική καταχώρηση'
            },
            description: {
                en: 'Test description',
                ru: 'Тестовое описание',
                el: 'Δοκιμαστική περιγραφή'
            },
            category: category._id,
            price: {
                amount: 1000,
                currency: 'EUR'
            },
            location: {
                city: 'Limassol',
                district: 'Center'
            },
            author: user._id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        console.log('Test listing created:', listing.title.en);

        console.log('Test data created successfully');
    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

createTestData();