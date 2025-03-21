require('dotenv').config();
const mongoose = require('mongoose');
const { format } = require('util');

async function checkDatabaseStatus() {
    try {
        console.log('Checking database status...\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection;

        // Basic Connection Info
        console.log('Connection Information:');
        console.log('----------------------');
        console.log(`Host: ${db.host}`);
        console.log(`Database: ${db.name}`);
        console.log(`State: ${db.readyState === 1 ? 'Connected' : 'Disconnected'}`);

        // Collections Status
        const collections = await db.db.listCollections().toArray();
        console.log('\nCollections Status:');
        console.log('------------------');
        
        for (const collection of collections) {
            const stats = await db.db.collection(collection.name).stats();
            console.log(`\n${collection.name}:`);
            console.log(` - Documents: ${stats.count}`);
            console.log(` - Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(` - Avg Document Size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);
            console.log(` - Indexes: ${stats.nindexes}`);
            console.log(` - Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        }

        // Index Status
        console.log('\nIndex Status:');
        console.log('-------------');
        for (const collection of collections) {
            const indexes = await db.db.collection(collection.name).indexes();
            console.log(`\n${collection.name} indexes:`);
            indexes.forEach(index => {
                console.log(` - ${index.name}`);
                console.log(`   Key: ${JSON.stringify(index.key)}`);
                if (index.unique) console.log('   [Unique Index]');
                if (index.sparse) console.log('   [Sparse Index]');
            });
        }

        // Database Size
        const stats = await db.db.stats();
        console.log('\nDatabase Size:');
        console.log('--------------');
        console.log(`Total Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Average Object Size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);

        await mongoose.disconnect();
        console.log('\n✅ Database status check completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database status check failed:', error);
        process.exit(1);
    }
}

checkDatabaseStatus();