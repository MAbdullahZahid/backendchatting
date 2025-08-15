const express = require("express");
const { User } = require("./model/schema");
const { Chat, Message } = require("./model/schema");
require("dotenv").config();
const connectDB = require("./dbconnection/dbConnection");
const { createAllSchemas } = require("./model/schema");
const cors = require("cors");

const signupRoutes = require("./routes/signupRoute");
const loginRoutes = require("./routes/loginRoute");
const chatRoutes = require("./routes/chatRoutes");
const allContacts = require("./routes/allContactsRoutes");





const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Chatting APP");
});

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // replace "*" with your frontend URL in production
    methods: ["GET", "POST"],
  },
});

let connectedUsers = [];

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("userJoined", async (userId) => {
    socket.userId = userId; 
    try {
      const user = await User.findById(userId).select("username phoneNo");
      await User.findByIdAndUpdate(userId, { status: "online" }, { new: true });
    
      if (!user) {
        console.log(`User with ID ${userId} not found`);
        return;
      }

      const username = user.username || "Unknown";
      const phoneNo = user.phoneNo || null;

      console.log(`${username} joined (socket: ${socket.id})`);

      const existingIndex = connectedUsers.findIndex(u => u.userId === userId);
      if (existingIndex !== -1) {
        connectedUsers[existingIndex].socketId = socket.id;
      } else {
        connectedUsers.push({
          userId,
          phoneNo,
          socketId: socket.id,
          username,
        });
      }

      io.emit("broadcast", { message: `${username} has joined` });
      io.emit("userStatusUpdate", { userId, status: "online" });

      console.log("Connected users:", connectedUsers);
    } catch (error) {
      console.error("Error in userJoined:", error);
    }
  });

socket.on("markMessagesRead", async ({ chatId, userId }) => {
  try {
    if (!chatId || !userId) return;

    const chat = await Chat.findById(chatId);
    if (!chat) return;

    // Mark all messages from the OTHER user as read
    await Message.updateMany(
      { chatId, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    // Reset unread count in Chat doc
    if (String(userId) === String(chat.senderId)) {
      chat.unreadMessages.sender = 0;
    } else {
      chat.unreadMessages.receiver = 0;
    }
    await chat.save();
    
const currentSocket = connectedUsers.find(u => String(u.userId) === userId);
if (currentSocket) {
  io.to(currentSocket.socketId).emit("contactsUpdate", {
    chatId: chat._id.toString(),
    unreadMessages:
      String(userId) === String(chat.senderId)
        ? chat.unreadMessages.sender
        : chat.unreadMessages.receiver
  });
}


   
    const otherUserId = String(userId) === String(chat.senderId)
      ? String(chat.receiverId)
      : String(chat.senderId);

    // Find their socket connection
    const otherSocket = connectedUsers.find(
      u => String(u.userId) === otherUserId
    );

    if (otherSocket) {
      io.to(otherSocket.socketId).emit("messagesRead", { chatId });
    }

  
  } catch (err) {
    console.error("Error marking messages as read:", err);
  }
});

socket.on("sendMessage", async ({ chatId, messageText, senderId }) => {
  console.log("Inside Socket First")
  try {
    if (!chatId || !messageText || !senderId) {
      socket.emit("error", { message: "chatId, messageText, and senderId are required" });
      return;
    }

    // Find chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      socket.emit("error", { message: "Chat not found" });
      return;
    }

    
    if (![chat.senderId.toString(), chat.receiverId.toString()].includes(senderId)) {
      socket.emit("error", { message: "Sender not part of this chat" });
      return;
    }

    // Create new message with the actual sender
    const newMessage = await Message.create({
      chatId,
      senderId,
      messageText,
    });

   console.log("Inside Send Message Socket")
   
  if (senderId === chat.senderId.toString()) {
  chat.unreadMessages.receiver += 1; 
} else {
  chat.unreadMessages.sender += 1;   
}

chat.messageId = newMessage._id;
chat.chatTime = new Date();
await chat.save();

    
// After chat.save()
const receiverId =
  senderId === chat.senderId.toString()
    ? chat.receiverId.toString()
    : chat.senderId.toString();

// Emit to receiver so their unread count updates
const receiverSocket = connectedUsers.find(u => String(u.userId) === receiverId);
if (receiverSocket) {
  io.to(receiverSocket.socketId).emit("contactsUpdate", {
    chatId: chat._id.toString(),
    unreadMessages:
      senderId === chat.senderId.toString()
        ? chat.unreadMessages.receiver
        : chat.unreadMessages.sender
  });
}

// Emit to sender too (optional — if you want sender's list to reflect changes)
const senderSocket = connectedUsers.find(u => String(u.userId) === senderId);
if (senderSocket) {
  io.to(senderSocket.socketId).emit("contactsUpdate", {
    chatId: chat._id.toString(),
    unreadMessages:
      senderId === chat.senderId.toString()
        ? chat.unreadMessages.sender
        : chat.unreadMessages.receiver
  });
}

    // Get sender's username for notification
    const sender = await User.findById(senderId).select("username");

    io.emit("newMessage", {
      _id: newMessage._id,
      chatId,
      senderId,
      senderUsername: sender.username,
      messageText,
      createdAt: newMessage.createdAt,
    });

  } catch (error) {
    console.error("Error in sendMessage:", error);
    socket.emit("error", { message: "Failed to send message" });
  }
});

socket.on("sendVoiceMessage", async ({ chatId, senderId, voiceMessage }) => {
  try {
    if (!chatId || !senderId || !voiceMessage) {
      socket.emit("error", { message: "chatId, senderId and voiceMessage are required" });
      return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      socket.emit("error", { message: "Chat not found" });
      return;
    }

    // Make sure sender is part of chat
    if (![chat.senderId.toString(), chat.receiverId.toString()].includes(senderId)) {
      socket.emit("error", { message: "Sender not part of this chat" });
      return;
    }

    // Create message with voiceMessage
    const newMessage = await Message.create({
      chatId,
      senderId,
      voiceMessage
    });

    // Update unread count
    if (senderId === chat.senderId.toString()) {
      chat.unreadMessages.receiver += 1;
    } else {
      chat.unreadMessages.sender += 1;
    }

    chat.messageId = newMessage._id;
    chat.chatTime = new Date();
    await chat.save();

    // Emit to receiver
    const receiverId =
      senderId === chat.senderId.toString() ? chat.receiverId.toString() : chat.senderId.toString();
    const receiverSocket = connectedUsers.find(u => u.userId === receiverId);
    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit("contactsUpdate", {
        chatId: chat._id.toString(),
        unreadMessages:
          senderId === chat.senderId.toString()
            ? chat.unreadMessages.receiver
            : chat.unreadMessages.sender
      });
    }

    // Emit VM to both sender and receiver
    io.to(socket.id).emit("newVoiceMessage", newMessage);
    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit("newVoiceMessage", newMessage);
    }

  } catch (err) {
    console.error("Error sending voice message:", err);
    socket.emit("error", { message: "Failed to send voice message" });
  }
});

 socket.on("requestUserStatus", async (userId) => {
    try {
      const user = await User.findById(userId).select("status");
      if (user) {
        socket.emit("userStatusUpdate", { 
          userId, 
          status: user.status || "offline" 
        });
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  });

  socket.on("requestAllUserStatuses", async () => {
    try {
      const users = await User.find({}).select("_id status");
      users.forEach(user => {
        socket.emit("userStatusUpdate", {
          userId: user._id.toString(),
          status: user.status || "offline"
        });
      });
    } catch (error) {
      console.error("Error fetching all user statuses:", error);
    }
  });

socket.on("deleteMessage", async ({ messageId, chatId }) => {
  try {
    if (!messageId || !chatId) return;

    // Ensure the socket has userId
    if (!socket.userId) {
      console.log("Socket missing userId");
      return;
    }

    const message = await Message.findById(messageId);
    if (!message) {
      console.log("Message not found:", messageId);
      return;
    }

    // Only allow the sender to delete their own message
    if (message.senderId.toString() !== socket.userId) {
      console.log("Unauthorized delete attempt by", socket.userId);
      return;
    }

    // Delete from DB
    await Message.findByIdAndDelete(messageId);
    console.log("Message deleted from DB:", messageId);

    // Notify all chat participants
    const chat = await Chat.findById(chatId);
    if (!chat) return;

    const users = [chat.senderId.toString(), chat.receiverId.toString()];
    users.forEach((userId) => {
      const userSocket = connectedUsers.find(u => u.userId === userId);
      if (userSocket) {
        io.to(userSocket.socketId).emit("messageDeleted", { messageId });
      }
    });

  } catch (err) {
    console.error("Error deleting message:", err);
    socket.emit("error", { message: "Failed to delete message" });
  }
});


  socket.on("disconnect", async () => {
  const disconnectedUser = connectedUsers.find(u => u.socketId === socket.id);
  if (disconnectedUser) {
    await User.findByIdAndUpdate(disconnectedUser.userId, { status: "offline" });

   
    connectedUsers = connectedUsers.filter(u => u.socketId !== socket.id);

   
    io.emit("userStatusUpdate", {
      userId: disconnectedUser.userId,
      status: "offline"
    });
  }
});


});


server.listen(5000, () => {
  console.log("WebSocket server running on port 5000");
});

// app.listen(3000, () => {
//   console.log("HTTP server running on port 3000");
// });

connectDB();
createAllSchemas();

app.use("/api", signupRoutes);
app.use("/api", loginRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api", allContacts);
app.use("/api/messages", require("./routes/messageRoutes"));