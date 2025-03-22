// #filename=scripts/check-env.js#
const fs = require('fs');
const path = require('path');

function checkEnvVariables() {
    console.log('🔍 Checking environment variables...');

    const requiredVariables = [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    const missingVariables = [];
    const weakVariables = [];

    // Проверка наличия переменных
    for (const variable of requiredVariables) {
        if (!process.env[variable]) {
            missingVariables.push(variable);
        }
    }

    // Проверка безопасности значений
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        weakVariables.push('JWT_SECRET (should be at least 32 characters)');
    }

    if (process.env.NODE_ENV === 'production') {
        if (process.env.CORS_ORIGIN === '*') {
            weakVariables.push('CORS_ORIGIN (should not be * in production)');
        }
        
        if (parseInt(process.env.RATE_LIMIT_MAX) > 100) {
            weakVariables.push('RATE_LIMIT_MAX (should not be more than 100 in production)');
        }
    }

    // Вывод результатов
    if (missingVariables.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVariables.forEach(variable => {
            console.error(`   - ${variable}`);
        });
    }

    if (weakVariables.length > 0) {
        console.warn('⚠️  Weak or insecure configuration detected:');
        weakVariables.forEach(variable => {
            console.warn(`   - ${variable}`);
        });
    }

    if (missingVariables.length === 0 && weakVariables.length === 0) {
        console.log('✅ All environment variables are properly configured');
        return true;
    }

    return false;
}

// Запуск проверки
if (require.main === module) {
    const result = checkEnvVariables();
    if (!result) {
        process.exit(1);
    }
}

module.exports = checkEnvVariables;