const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { searchUsers, updateProfile, getUserById } = require('../controllers/userController');
const { sendRequest, respondToRequest } = require('../controllers/friendController');

router.get('/search', auth, searchUsers);
router.post('/request/:id', auth, sendRequest);
router.put('/request/respond/:requestId', auth, respondToRequest);
router.patch("/profile", auth, updateProfile);
router.get('/requests/pending', auth, async (req, res) => {
  const requests = await Friendship.find({ receiver: req.user, status: 'pending' })
    .populate('sender', 'name username profilePicture');
  res.json(requests);
});
router.get("/:userId", auth, getUserById);
module.exports = router;