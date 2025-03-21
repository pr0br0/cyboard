// scripts/check-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const collections = await mongoose.connection.db.collections();

        for (const collection of collections) {
            const indexes = await collection.indexes();
            console.log(`\nIndexes for ${collection.collectionName}:`);
            indexes.forEach(index => {
                console.log(` - ${index.name}`);
                console.log(`   Key: ${JSON.stringify(index.key)}`);
                console.log(`   Properties: ${JSON.stringify(index)}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkIndexes();