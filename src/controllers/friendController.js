const Friendship = require('../models/Friendship');

exports.sendRequest = async (req, res) => {
  try {
    const receiverId = req.params.id;

    if (receiverId === req.user) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const existing = await Friendship.findOne({
      $or: [
        { sender: req.user, receiver: receiverId },
        { sender: receiverId, receiver: req.user }
      ]
    });

    if (existing) return res.status(400).json({ message: "Request already exists or you are already friends" });

    const newRequest = new Friendship({
      sender: req.user,
      receiver: receiverId,
      status: 'pending'
    });

    await newRequest.save();
    
    res.status(201).json({ message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    const request = await Friendship.findById(requestId);
    if (!request || request.receiver.toString() !== req.user) {
      return res.status(404).json({ message: "Request not found or unauthorized" });
    }

    if (status === 'accepted') {
      request.status = 'accepted';
      await request.save();

      // Update both User documents
      await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
      await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });
    } else {
      // If rejected, we just delete the friendship document
      await request.deleteOne();
    }

    res.json({ message: `Request ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};