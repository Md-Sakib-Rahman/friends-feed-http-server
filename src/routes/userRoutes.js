const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { searchUsers, updateProfile, getUserById, getMe } = require('../controllers/userController');
const { sendRequest, respondToRequest, getPendingRequests, getSentRequests, cancelRequest, unfriendUser } = require('../controllers/friendController');



router.get('/search', auth, searchUsers);
router.get('/profile', auth, getMe);
router.patch("/profile", auth, updateProfile);


router.post('/request/:id', auth, sendRequest);
router.get('/requests/pending', auth, getPendingRequests);
router.get('/requests/sent', auth, getSentRequests);
router.put('/request/respond/:requestId', auth, respondToRequest);
router.delete('/request/cancel/:requestId', auth, cancelRequest);
router.post('/unfriend/:userId', auth, unfriendUser);
router.get("/:userId", auth, getUserById);


module.exports = router;