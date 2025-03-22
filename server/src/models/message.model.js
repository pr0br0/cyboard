const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: String,
    type: String,
    name: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ listing: 1 });

module.exports = mongoose.model('Message', messageSchema); 