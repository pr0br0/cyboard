require('dotenv').config();
const mongoose = require('mongoose'); // Добавляем импорт mongoose
const connectDB = require('../config/database');
const Category = require('../models/category.model');
const User = require('../models/user.model');
const Listing = require('../models/listing.model');

const seedData = {
    categories: [
        {
            name: {
                en: 'Real Estate',
                ru: 'Недвижимость',
                el: 'Ακίνητα'
            },
            slug: 'real-estate'
        },
        {
            name: {
                en: 'Vehicles',
                ru: 'Транспорт',
                el: 'Οχήματα'
            },
            slug: 'vehicles'
        },
        {
            name: {
                en: 'Jobs',
                ru: 'Работа',
                el: 'Εργασία'
            },
            slug: 'jobs'
        }
    ],
    users: [
        {
            email: 'admin@example.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'admin'
        },
        {
            email: 'user@example.com',
            password: 'user123',
            name: 'Regular User',
            role: 'user'
        }
    ]
};

async function seedDatabase() {
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

        // Создаем категории
        const categories = await Category.create(seedData.categories);
        console.log('Categories created:', categories.length);

        // Создаем пользователей
        const users = await User.create(seedData.users);
        console.log('Users created:', users.length);

        // Создаем тестовые объявления
        const listings = await Promise.all(categories.map(async (category, index) => {
            return Listing.create({
                title: {
                    en: `Test Listing ${index + 1}`,
                    ru: `Тестовое объявление ${index + 1}`,
                    el: `Δοκιμαστική καταχώρηση ${index + 1}`
                },
                description: {
                    en: 'Test description',
                    ru: 'Тестовое описание',
                    el: 'Δοκιμαστική περιγραφή'
                },
                category: category._id,
                price: {
                    amount: 1000 * (index + 1),
                    currency: 'EUR'
                },
                location: {
                    city: 'Limassol',
                    district: 'Center'
                },
                author: users[0]._id,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
        }));
        console.log('Listings created:', listings.length);

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

seedDatabase();