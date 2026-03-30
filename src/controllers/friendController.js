const Friendship = require("../models/Friendship");
const User = require("../models/User");
const Notification = require("../models/Notification");
const publishNotification = require("../utils/socketPublisher");
exports.sendRequest = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.user.id;

    if (receiverId === senderId.toString()) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const existing = await Friendship.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      return res.status(400).json({
        message: "Request already exists or you are already friends",
      });
    }

    const newRequest = new Friendship({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });
    await newRequest.save();

    await Notification.findOneAndUpdate(
      {
        receiver: receiverId,
        type: "friend_request",
        isRead: false,
      },
      {
        $addToSet: { senders: senderId },
        $inc: { count: 1 },
        $set: { updatedAt: Date.now() },
      },
      { upsert: true, new: true }
    );

    publishNotification(receiverId, "NEW_NOTIFICATION", {
      type: "friend_request",
      senderName: req.user.name,
      senderPic: req.user.profilePicture,
      senderId: senderId,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Friend request sent", success: true });
  } catch (error) {
    console.error("Send Request Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user;

    const requests = await Friendship.find({
      receiver: currentUserId,
      status: "pending",
    }).populate("sender", "name username profilePicture");

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get Pending Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const currentUserId = req.user.id || req.user;

    const request = await Friendship.findById(requestId);

    if (!request || request.receiver.toString() !== currentUserId.toString()) {
      return res
        .status(404)
        .json({ message: "Request not found or unauthorized" });
    }

    if (status === "accepted") {
      request.status = "accepted";
      await request.save();

      await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: request.receiver },
      });
      await User.findByIdAndUpdate(request.receiver, {
        $addToSet: { friends: request.sender },
      });

      res.json({ message: "Friend request accepted", success: true });
    } else {
      await request.deleteOne();
      res.json({ message: "Friend request rejected", success: true });
    }
  } catch (error) {
    console.error("Respond Request Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getSentRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      sender: req.user.id || req.user,
      status: "pending",
    }).populate("receiver", "name username profilePicture");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const result = await Friendship.findByIdAndDelete(requestId);
    if (!result) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.unfriendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user;

    await Friendship.findOneAndDelete({
      $or: [
        { sender: currentUserId, receiver: userId, status: "accepted" },
        { sender: userId, receiver: currentUserId, status: "accepted" },
      ],
    });

    await User.findByIdAndUpdate(currentUserId, { $pull: { friends: userId } });

    await User.findByIdAndUpdate(userId, { $pull: { friends: currentUserId } });

    res.status(200).json({ message: "Unfriended successfully", success: true });
  } catch (error) {
    console.error("Unfriend Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
