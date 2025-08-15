const { Chat, User } = require("../model/schema");
const mongoose = require("mongoose");

exports.getUserContacts = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const chats = await Chat.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
      .populate("senderId", "phoneNo username status")
      .populate("receiverId", "phoneNo username status");

    const contacts = chats.map(chat => {
      try {
        const isSender = chat.senderId._id.toString() === userId;
        const otherUser = isSender ? chat.receiverId : chat.senderId;
        if (!otherUser) return null;

        return {
          chatId: chat._id.toString(),
          userId: otherUser._id.toString(),
          unreadMessages: chat.unreadMessages ? 
            (isSender ? chat.unreadMessages.sender : chat.unreadMessages.receiver) : 0,
          phoneNo: otherUser.phoneNo,
          name: otherUser.name,
          status: otherUser.status
        };
      } catch (err) {
        console.error("Error mapping chat:", err);
        return null;
      }
    }).filter(c => c !== null);

    res.json(contacts);
  } catch (err) {
    console.error("getUserContacts error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ Find or create chat by userId & other person's phoneNo
exports.findOrCreateChat = async (req, res) => {
  try {
    const { userId, phoneNo } = req.body;

    if (!userId || !phoneNo) {
      return res.status(400).json({ error: "userId and phoneNo are required" });
    }

    // 1. Find the other user
    const otherUser = await User.findOne({ phoneNo });
    if (!otherUser) {
      return res.status(404).json({ error: "Other user not found" });
    }

    // 2. Check if chat already exists
    let chat = await Chat.findOne({
      $or: [
        { senderId: userId, receiverId: otherUser._id },
        { senderId: otherUser._id, receiverId: userId }
      ]
    });

    // 3. If not, create it
    if (!chat) {
      chat = new Chat({
        senderId: userId,
        receiverId: otherUser._id
      });
      await chat.save();
    }

    res.json({ chatId: chat._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
