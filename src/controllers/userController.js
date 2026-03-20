const User = require('../models/User');

// ১. ইউজার সার্চ (Fix: req.user.id ব্যবহার করা হয়েছে)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query is required" });

    const currentUserId = req.user.id; // Middleware থেকে আসছে

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // নিজেকে সার্চ রেজাল্ট থেকে বাদ দেওয়া
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name username profilePicture')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ২. প্রোফাইল আপডেট (Fix: returnDocument এবং আইডি হ্যান্ডলিং)
exports.updateProfile = async (req, res) => {
  try {
    const { name, username, bio, about, profilePicture } = req.body;
    const userId = req.user.id;  

    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, username, bio, about, profilePicture } },
      { returnDocument: 'after', runValidators: true }
    ).select("-passwordHash");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ৩. আইডি দিয়ে ইউজার প্রোফাইল পাওয়া
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-passwordHash")
      .populate("friends", "name username profilePicture");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// const User = require('../models/User');

// exports.searchUsers = async (req, res) => {
//   try {
//     const { query } = req.query;
//     if (!query) return res.status(400).json({ message: "Search query is required" });

//     const users = await User.find({
//       $and: [
//         { _id: { $ne: req.user } }, 
//         {
//           $or: [
//             { username: { $regex: query, $options: 'i' } },
//             { name: { $regex: query, $options: 'i' } }
//           ]
//         }
//       ]
//     })
//     .select('name username profilePicture')
//     .limit(10);

//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };


// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, username, bio, about, profilePicture } = req.body;
//     const userId = req.user.id;  
//     console.log("--- Update Process Started ---");
//     console.log("Incoming Body:", req.body);

//     console.log("Target User ID:", userId);
//     if (username) {
//       const existingUser = await User.findOne({ username, _id: { $ne: userId } });
//       if (existingUser) {
//         return res.status(400).json({ message: "Username already taken" });
//       }
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       {
//         $set: { name, username, bio, about, profilePicture },
//       },
//       { 
         
//         returnDocument: 'after'
//       }  
//     ).select("-passwordHash");

//     res.status(200).json({
//       success: true,
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Update Profile Error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// exports.getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId)
//       .select("-passwordHash")
//       .populate("friends", "name username profilePicture");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ success: true, user });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };