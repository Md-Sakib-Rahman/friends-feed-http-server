const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text
    });

    conversation.lastMessage = newMessage._id;
    
    await Promise.all([newMessage.save(), conversation.save()]);

    // TODO: Trigger Socket.io "new_message" event here via Redis
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user] }
    })
    .populate('participants', 'name username profilePicture')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });  

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getChatHistory = async (req, res) => {
  try {
    const { convId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor;  

    let query = { conversationId: convId };
    
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 }) 
      .limit(limit)
      .populate('sender', 'name username profilePicture');

    const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;

    res.json({ 
      messages: messages.reverse(),  
      nextCursor 
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};