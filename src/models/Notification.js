const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  type: { 
    type: String, 
    enum: ['friend_request', 'post_like', 'post_comment'], 
    required: true 
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  count: { type: Number, default: 1 },
  isRead: { type: Boolean, default: false },
  content: { type: String }, 
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);