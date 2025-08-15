const { User, Chat } = require("../model/schema");

exports.getAllUserContacts = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("userId param:", userId);

    // Get all users except the current user
    const users = await User.find({ _id: { $ne: userId } }, { phoneNo: 1 });

    // Get all chats involving userId
    const chats = await Chat.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    // Create a quick lookup: key = otherUserId, value = chatId
    const chatMap = {};
    chats.forEach(chat => {
      // find the other user in the chat
      const otherUserId = 
        chat.senderId.toString() === userId ? chat.receiverId.toString() : chat.senderId.toString();
      chatMap[otherUserId] = chat._id.toString();
    });

    // Map users to include phoneNo and chatId if exists
    const contacts = users.map(user => ({
      userId: user._id.toString(),
      phoneNo: user.phoneNo,
      chatId: chatMap[user._id.toString()] || null, // null if no chat exists
    }));
console.log("Backend Contacts", contacts)
    res.json(contacts);
  } catch (error) {
    console.error("Error fetching all user contacts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
