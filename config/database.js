// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            autoIndex: false // Отключаем автоматическое создание индексов
        });

        console.log('\n✅ MongoDB: Connection Established');
        console.log('MongoDB Atlas Connection Status:');
        console.log('--------------------------------');
        console.log(`Host: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        console.log(`State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        console.log('--------------------------------');
        console.log('✅ Database connected successfully\n');

    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;