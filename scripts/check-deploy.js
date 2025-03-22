// #filename=scripts/check-deploy.js#
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Загружаем конфигурацию production
dotenv.config({ path: '.env.production' });

async function checkDeploy() {
    console.log('🔍 Checking deployment prerequisites...');

    // Проверяем наличие необходимых переменных окружения
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars);
        process.exit(1);
    }

    // Проверяем подключение к базе данных
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database connection successful');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }

    console.log('✅ All deployment checks passed!');
}

checkDeploy().catch(console.error);