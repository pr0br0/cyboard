// scripts/test-db.js
require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors/safe');

async function testDatabase() {
    try {
        console.log(colors.yellow('\nTesting Database Connection...\n'));

        await mongoose.connect(process.env.MONGODB_URI);
        console.log(colors.green('✓ Connected to database'));

        const db = mongoose.connection;
        console.log('\nDatabase Information:');
        console.log('--------------------');
        console.log(`Host: ${db.host}`);
        console.log(`Database: ${db.name}`);
        console.log(`Port: ${db.port}`);

        // Проверка коллекций
        const collections = await db.db.listCollections().toArray();
        console.log('\nCollections:');
        console.log('------------');
        
        for (const collection of collections) {
            const stats = await db.db.collection(collection.name).stats();
            console.log(`\n${collection.name}:`);
            console.log(colors.cyan(` Documents: ${stats.count}`));
            console.log(colors.cyan(` Size: ${(stats.size / 1024).toFixed(2)} KB`));
            console.log(colors.cyan(` Indexes: ${stats.nindexes}`));
        }

        // Тест операций CRUD
        console.log(colors.yellow('\nTesting CRUD Operations...\n'));

        const TestModel = mongoose.model('Test', new mongoose.Schema({
            name: String,
            timestamp: Date
        }));

        // Create
        const doc = await TestModel.create({
            name: 'test',
            timestamp: new Date()
        });
        console.log(colors.green('✓ Create operation successful'));

        // Read
        const readDoc = await TestModel.findById(doc._id);
        console.log(colors.green('✓ Read operation successful'));

        // Update
        await TestModel.updateOne({ _id: doc._id }, { name: 'updated' });
        console.log(colors.green('✓ Update operation successful'));

        // Delete
        await TestModel.deleteOne({ _id: doc._id });
        console.log(colors.green('✓ Delete operation successful'));

        // Очистка
        await mongoose.connection.dropCollection('tests');

        await mongoose.disconnect();
        console.log(colors.green('\n✓ All database tests passed\n'));
        process.exit(0);
    } catch (error) {
        console.error(colors.red('\n✗ Database test failed:'), error);
        process.exit(1);
    }
}

testDatabase();