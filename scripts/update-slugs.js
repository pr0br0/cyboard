// scripts/update-slugs.js
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing.model');

async function updateSlugs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        // Удаляем существующий индекс slug
        try {
            await mongoose.connection.collection('listings').dropIndex('slug_1');
            console.log('Existing slug index dropped');
        } catch (error) {
            console.log('No existing slug index found');
        }

        // Обновляем записи без slug
        const listings = await Listing.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });
        console.log(`Found ${listings.length} listings without slugs`);

        for (const listing of listings) {
            if (listing.title && listing.title.en) {
                await listing.save();
                console.log(`Updated slug for listing ${listing._id}`);
            }
        }

        // Создаем новый индекс
        await Listing.createIndexes();
        console.log('New indexes created');

        console.log('Slugs updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating slugs:', error);
        process.exit(1);
    }
}

updateSlugs();