const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Redis = require("ioredis");
const redisPublisher = new Redis(process.env.REDIS_URL);
const User = require("../models/User");

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        unreadCounts: { [receiverId]: 0, [senderId]: 0 },
      });
    }

    // const newMessage = new Message({
    //   conversationId: conversation._id,
    //   sender: senderId,
    //   content: text,
    // });
    const newMessage = new Message({
      sender: senderId,
      receiverId,
      content: text,
      conversationId: conversation._id,
      isSeen: false,  
    });
    conversation.lastMessage = newMessage._id;

    const currentUnread = conversation.unreadCounts.get(receiverId) || 0;
    conversation.unreadCounts.set(receiverId, currentUnread + 1);

    await Promise.all([newMessage.save(), conversation.save()]);

    const socketPayload = {
      to: receiverId,
      type: "NEW_MESSAGE",
      payload: {
        ...newMessage._doc,
        sender: {
          _id: req.user._id,
          name: req.user.name,
          profilePicture: req.user.profilePicture,
        },
      },
    };

    await redisPublisher.publish(
      "NOTIFICATION_CHANNEL",
      JSON.stringify(socketPayload),
    );

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate({
        path: "participants",
        select: "name username profilePicture",
      })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { convId } = req.params;
    const userId = req.user.id;

    // ১. প্রথমে কনভারসেশনটি খুঁজুন
    const conversation = await Conversation.findById(convId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // ২. চেক করুন ইউজার কি এই চ্যাটের মেম্বার? (String এ কনভার্ট করে চেক করা সেফ)
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString(),
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this chat" });
    }

    // বাকি লজিক (মেসেজ ফেচ করা)...
    let query = { conversationId: convId };
    const messages = await Message.find(query).sort({ _id: -1 }).limit(20);

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(
      req.params.chatId,
    ).populate("participants", "name username profilePicture");

    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.targetId;

    let conversation = await Conversation.findById(targetId).populate(
      "participants",
      "name username profilePicture",
    );

    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, targetId] },
      }).populate("participants", "name username profilePicture");
    }

    if (conversation) {
      const messages = await Message.find({
        conversationId: conversation._id,
      }).sort({ createdAt: 1 });
      const friend = conversation.participants.find(
        (p) => p._id.toString() !== userId.toString(),
      );

      return res.json({ conversation, messages, friend });
    }

    const friend = await User.findById(targetId).select(
      "name username profilePicture",
    );
    if (!friend) return res.status(404).json({ message: "User not found" });

    res.json({ conversation: null, messages: [], friend });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const { convId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { conversationId: convId, sender: { $ne: userId }, isSeen: false },
      { $set: { isSeen: true } },
    );

    const conversation = await Conversation.findById(convId);
    if (conversation) {
      conversation.unreadCounts.set(userId, 0);
      await conversation.save();
    }

    res.json({ message: "Marked as seen" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      const count = conv.unreadCounts.get(userId.toString()) || 0;
      totalUnread += count;
    });

    res.json({ count: totalUnread });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
