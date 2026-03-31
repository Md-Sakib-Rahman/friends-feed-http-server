const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { sendMessage, getConversations, getChatHistory, getConversationById, getOrCreateConversation, markAsSeen, getUnreadMessageCount } = require('../controllers/messageController');

router.get('/unread-count', auth, getUnreadMessageCount);
router.get('/conversations', auth, getConversations);
router.get('/conversation/:chatId', auth, getConversationById);
router.post('/send', auth, sendMessage);
router.get('/history/:convId', auth, getChatHistory);
router.get('/get-or-create/:targetId', auth, getOrCreateConversation);
router.put('/seen/:convId', auth, markAsSeen);
module.exports = router;