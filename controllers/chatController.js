const { Chat, User } = require("../model/schema");

// ✅ Get existing chats for a user (no chat creation here)
exports.getUserContacts = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await Chat.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
      .populate("senderId", "phoneNo name status")
      .populate("receiverId", "phoneNo name status");

    const contacts = chats.map(chat => {
      const isSender = chat.senderId._id.toString() === userId;
  const otherUser = isSender ? chat.receiverId : chat.senderId;


      return {
       
        chatId: chat._id.toString(),
         userId: otherUser._id.toString(),
    unreadMessages: isSender 
      ? chat.unreadMessages.sender || 0
      : chat.unreadMessages.receiver || 0,
    phoneNo: otherUser.phoneNo,
    name: otherUser.name,
    status: otherUser.status
  };
    });

    res.json(contacts);
  } catch (err) {
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
