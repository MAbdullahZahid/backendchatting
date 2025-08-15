// controllers/messageController.js

const { Message } = require("../model/schema");
const mongoose = require("mongoose");

exports.getMessagesByChatId = async (req, res) => {
  try {
    const { chatId } = req.query;
    console.log("Backend Chat ID", chatId);

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid or missing chatId" });
    }

    const messages = await Message.find({ chatId: new mongoose.Types.ObjectId(chatId) })
      .sort({ createdAt: 1 }) // oldest first
      .populate("senderId", "name phoneNo"); // optional: populate sender details

   const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      chatId: msg.chatId,
      messageText: msg.messageText,
      voiceMessage: msg.voiceMessage,
      senderId: msg.senderId._id,
      senderName: msg.senderId.name,
      senderPhoneNo: msg.senderId.phoneNo,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
      
    }));

    res.json(formattedMessages);
  } catch (err) {
    console.error("Error fetching messages by chatId:", err);
    res.status(500).json({ message: "Server error" });
  }
};
