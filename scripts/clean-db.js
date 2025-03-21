require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function cleanDatabase() {
    try {
        await connectDB();
        console.log('Connected to database');

        // Получаем все коллекции
        const collections = await mongoose.connection.db.collections();

        // Очищаем каждую коллекцию
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`Collection ${collection.collectionName} cleared`);
        }

        console.log('Database cleaned successfully');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit();
    }
}

cleanDatabase();