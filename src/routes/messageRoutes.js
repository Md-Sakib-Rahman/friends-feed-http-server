const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { sendMessage, getConversations, getChatHistory } = require('../controllers/messageController');

router.get('/', auth, getConversations);
router.post('/send', auth, sendMessage);
router.get('/:convId', auth, getChatHistory);

module.exports = router;