// models/review.model.js
const reviewSchema = new mongoose.Schema({
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true
  });