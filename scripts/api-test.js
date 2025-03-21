// scripts/test-api.js
const axios = require('axios');

async function testAPI() {
    const baseURL = 'http://localhost:3000';
    
    try {
        console.log('Testing API endpoints...\n');

        // Test basic endpoint
        console.log('Testing /api/test endpoint:');
        const response = await axios.get(`${baseURL}/api/test`);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Test error handling
        console.log('\nTesting error handling:');
        try {
            await axios.get(`${baseURL}/api/test/error`);
        } catch (error) {
            console.log('Error handling works correctly:');
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        }

        console.log('\n✅ API tests completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ API test failed:', error.message);
        process.exit(1);
    }
}

testAPI();