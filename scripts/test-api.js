// scripts/test-api.js
require('dotenv').config();
const axios = require('axios');
const colors = require('colors/safe');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testEndpoint(name, url, method = 'GET', data = null, token = null) {
    try {
        console.log(colors.cyan(`Testing ${name}...`));
        
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await axios({
            method,
            url: `${BASE_URL}${url}`,
            data,
            headers
        });

        console.log(colors.green('✓ Success'));
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return { success: true, data: response.data };
    } catch (error) {
        console.log(colors.red('✗ Failed'));
        console.log('Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

async function runTests() {
    console.log(colors.yellow('\nStarting API Tests...\n'));

    // Тест здоровья системы
    await testEndpoint('Health Check', '/health');

    // Тест статуса API
    await testEndpoint('API Status', '/api/status');

    // Тест API документации
    await testEndpoint('API Documentation', '/api');

    // Тест аутентификации
    console.log(colors.yellow('\nTesting Authentication...\n'));
    
    // Регистрация
    const registerData = {
        email: `test${Date.now()}@example.com`,
        password: 'testPassword123',
        name: 'Test User',
        phone: '+1234567890'
    };
    const registerResult = await testEndpoint('Register', '/api/auth/register', 'POST', registerData);

    // Вход
    const loginData = {
        email: registerData.email,
        password: registerData.password
    };
    const loginResult = await testEndpoint('Login', '/api/auth/login', 'POST', loginData);

    let token = null;
    if (loginResult.success) {
        token = loginResult.data.token;
        
        // Тест защищенного маршрута
        await testEndpoint('Get Profile', '/api/auth/profile', 'GET', null, token);
    }

    // Тест категорий
    console.log(colors.yellow('\nTesting Categories...\n'));
    
    // Получение категорий
    await testEndpoint('Get Categories', '/api/categories');

    // Создание категории (требует авторизации админа)
    const categoryData = {
        name: {
            en: 'Test Category',
            ru: 'Тестовая Категория',
            el: 'Δοκιμαστική Κατηγορία'
        },
        description: {
            en: 'Test Description',
            ru: 'Тестовое Описание',
            el: 'Δοκιμαστική Περιγραφή'
        }
    };
    await testEndpoint('Create Category', '/api/categories', 'POST', categoryData, token);

    // Тест объявлений
    console.log(colors.yellow('\nTesting Listings...\n'));
    
    // Получение объявлений
    await testEndpoint('Get Listings', '/api/listings');

    // Создание объявления
    const listingData = {
        title: {
            en: 'Test Listing',
            ru: 'Тестовое Объявление',
            el: 'Δοκιμαστική Καταχώρηση'
        },
        description: {
            en: 'Test Description',
            ru: 'Тестовое Описание',
            el: 'Δοκιμαστική Περιγραφή'
        },
        price: {
            amount: 100,
            currency: 'EUR',
            negotiable: true
        },
        location: {
            city: 'Limassol',
            district: 'Center',
            address: 'Test Address'
        }
    };
    await testEndpoint('Create Listing', '/api/listings', 'POST', listingData, token);

    console.log(colors.yellow('\nTesting Error Handling...\n'));
    
    // Тест обработки ошибок
    await testEndpoint('404 Error', '/api/nonexistent');
    await testEndpoint('Test Error', '/api/test/error');

    console.log(colors.yellow('\nTests Completed!\n'));
}

runTests().catch(console.error);