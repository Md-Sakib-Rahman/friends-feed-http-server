const express = require('express');
const router = express.Router();
const { createPost, getPosts, updatePost, deletePost, toggleLike, addComment, updateComment, deleteComment, getUserPosts } = require('../controllers/postController');
const auth = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');

//  POSTS ===============
router.get('/',auth,  getPosts);

router.post('/', auth, createPost);

router.put('/:id', auth, updatePost);

router.delete('/:id', auth, deletePost);

//  like and Comments ===============
router.put('/:id/like', auth, toggleLike);

router.post('/:id/comments', auth, addComment);

router.get('/:id/comments', async (req, res) => {
  try {
  

    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author', 'name username profilePicture');

    res.json(comments);
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err); 
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.put('/comment/:commentId', auth, updateComment);

router.delete('/comment/:commentId', auth, deleteComment);

router.get("/user/:userId", auth, getUserPosts);

module.exports = router;