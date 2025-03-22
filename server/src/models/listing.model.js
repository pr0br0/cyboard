const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Houses', 'Apartments', 'Land', 'Commercial']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    enum: ['Limassol', 'Nicosia', 'Larnaca', 'Paphos']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  features: [{
    type: String,
    enum: [
      'Swimming Pool',
      'Garden',
      'Parking',
      'Air Conditioning',
      'Central Heating',
      'Furnished',
      'Pet Friendly',
      'Security System',
      'Elevator',
      'Balcony'
    ]
  }],
  bedrooms: {
    type: Number,
    min: [0, 'Number of bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    min: [0, 'Number of bathrooms cannot be negative']
  },
  area: {
    type: Number,
    min: [0, 'Area cannot be negative']
  },
  yearBuilt: {
    type: Number,
    min: [1900, 'Invalid year built']
  },
  images: [{
    url: String,
    caption: String
  }],
  mainImage: {
    type: String,
    required: [true, 'Main image is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'sold', 'rented'],
    default: 'pending'
  },
  views: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },
  coordinates: {
    lat: Number,
    lng: Number
  }
}, {
  timestamps: true
});

// Index for search functionality
listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ location: 1, category: 1, price: 1 });

module.exports = mongoose.model('Listing', listingSchema); 