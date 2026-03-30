const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id })
      .populate('senders', 'name username profilePicture')
      .populate('post', 'content')
      .sort({ updatedAt: -1 })
      .limit(50);
      
    res.json(notifications);
  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
 
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      receiver: req.user.id, 
      isRead: false 
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};