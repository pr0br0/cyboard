const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const {
  sendMessage,
  getConversations,
  getMessages,
  deleteMessage,
  markAsRead
} = require('../controllers/message.controller');

const router = express.Router();

// Validation middleware
const messageValidation = [
  body('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('listingId').isMongoId().withMessage('Invalid listing ID'),
  body('content').trim().notEmpty().withMessage('Message content is required'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
];

// Routes
router.post('/', protect, messageValidation, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.delete('/:id', protect, deleteMessage);
router.put('/read/:userId', protect, markAsRead);

module.exports = router; 