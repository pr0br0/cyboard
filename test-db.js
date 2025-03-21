// test-db.js
require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');

const TEST_TIMEOUT = 30000; // 30 seconds

async function testDatabase() {
    let connection;
    try {
        logger.info('Testing MongoDB Connection...');
        
        // Enhanced connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: TEST_TIMEOUT,
            heartbeatFrequencyMS: 2000,
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: TEST_TIMEOUT,
            family: 4 // Force IPv4
        };

        connection = await mongoose.connect(process.env.MONGODB_URI, options);
        logger.info('\n✅ Connected to MongoDB');

        // Database information
        const db = connection.connection;
        logger.info('\nDatabase Information:');
        logger.info('--------------------');
        logger.info(`Host: ${db.host}`);
        logger.info(`Database Name: ${db.name}`);
        logger.info(`Port: ${db.port}`);
        logger.info(`State: ${db.readyState === 1 ? 'Connected' : 'Disconnected'}`);

        // Test write operation
        const testCollection = db.collection('test_collection');
        const testDoc = { test: true, timestamp: new Date() };
        await testCollection.insertOne(testDoc);
        const foundDoc = await testCollection.findOne({ test: true });
        
        if (!foundDoc) {
            throw new Error('Write test failed: Could not retrieve test document');
        }
        
        // Cleanup test document
        await testCollection.deleteOne({ test: true });

        // Get collections info
        const collections = await db.db.listCollections().toArray();
        logger.info('\nCollections:');
        logger.info('------------');
        for (const collection of collections) {
            const stats = await db.db.collection(collection.name).stats();
            logger.info(`\n${collection.name}:`);
            logger.info(` - Documents: ${stats.count}`);
            logger.info(` - Size: ${(stats.size / 1024).toFixed(2)} KB`);
            logger.info(` - Indexes: ${stats.nindexes}`);
        }

        await mongoose.disconnect();
        logger.info('\n✅ Database test completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('\n❌ Database test failed:', error);
        if (connection) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.disconnect();
        logger.info('Database connection closed through app termination');
        process.exit(0);
    } catch (err) {
        logger.error('Error during database disconnection:', err);
        process.exit(1);
    }
});

testDatabase();