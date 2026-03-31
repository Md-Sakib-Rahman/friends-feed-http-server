const Post = require("../models/Post");
const { postSchema } = require("../utils/postValidators");
const Comment = require("../models/Comment.js");
const Notification = require('../models/Notification');
const publishNotification = require('../utils/socketPublisher');
exports.createPost = async (req, res) => {
  try {
    const validatedData = postSchema.parse(req.body);
    const newPost = new Post({
      author: req.user.id,  
      content: validatedData.content,
      image: validatedData.image || "",
    });
    await newPost.save();
    
    const populatedPost = await Post.findById(newPost._id).populate(
      "author",
      "name username profilePicture"
    );
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Create Post Error:", err);
    if (err.name === "ZodError") return res.status(400).json({ errors: err.errors });
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor;
    let query = {};
    if (cursor && cursor !== "null" && cursor !== "undefined") {
      query._id = { $lt: cursor };
    }
    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("author", "name username profilePicture");

    const nextCursor = posts.length === limit ? posts[posts.length - 1]._id : null;
    res.json({ posts, nextCursor });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const senderId = req.user.id;
    const receiverId = post.author;

    const isLiked = post.likes.includes(senderId);

    if (isLiked) {
      post.likes.pull(senderId);
    } else {
      post.likes.addToSet(senderId);

      if (receiverId.toString() !== senderId.toString()) {
        await Notification.findOneAndUpdate(
          { 
            receiver: receiverId, 
            post: post._id, 
            type: 'post_like', 
            isRead: false 
          },
          { 
            $addToSet: { senders: senderId },
            $inc: { count: 1 },
            $set: { updatedAt: Date.now() }
          },
          { upsert: true, new: true }
        );

        publishNotification(receiverId, "NEW_NOTIFICATION", {
          type: 'post_like',
          senderName: req.user.name,
          postId: post._id
        });
      }
    }

    await post.save();
    res.json({ likes: post.likes, isLiked: !isLiked });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const senderId = req.user.id;

    if (!content) return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = new Comment({
      post: postId,
      author: senderId,
      content,
    });

    await newComment.save();
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    if (post.author.toString() !== senderId.toString()) {
      const receiverId = post.author;

      await Notification.findOneAndUpdate(
        {
          receiver: receiverId,
          post: postId,
          type: 'post_comment',
          isRead: false
        },
        {
          $addToSet: { senders: senderId },
          $inc: { count: 1 },
          $set: {
            content: content.substring(0, 50),
            updatedAt: Date.now()
          }
        },
        { upsert: true, new: true }
      );

      publishNotification(receiverId, "NEW_NOTIFICATION", {
        type: 'post_comment',
        senderName: req.user.name,
        senderPic: req.user.profilePicture,
        postId: postId,
        commentText: content,
        createdAt: new Date()
      });
    }

    const populatedComment = await newComment.populate("author", "name username profilePicture");
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { content, image } = postSchema.parse(req.body);
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    post.content = content || post.content;
    post.image = image || post.image;
    await post.save();

    const populatedPost = await post.populate("author", "name username profilePicture");
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    comment.content = content;
    await comment.save();
    const updatedComment = await comment.populate("author", "name username profilePicture");
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const postId = comment.post;
    await comment.deleteOne();
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor;
    
    let query = { author: userId };
    if (cursor && cursor !== "null" && cursor !== "undefined") {
      query._id = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("author", "name username profilePicture");

    const nextCursor = posts.length === limit ? posts[posts.length - 1]._id : null;
    res.status(200).json({ success: true, posts, nextCursor });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }

    const post = await Post.findById(id)
      .populate("author", "name username profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await Comment.find({ post: id })
      .populate("author", "name username profilePicture")
      .sort({ createdAt: -1 });

    res.json({
      ...post._doc,
      comments: comments
    });
  } catch (error) {
    console.error("GET_POST_BY_ID_ERROR:", error);  
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};