//model/schema.js

const mongoose = require("mongoose");
const validator = require("validator");

// 1. User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Full name is required"],
    minlength: [3, "Full name must be at least 3 characters"]
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    minlength: [3, "Username must be at least 3 characters"],
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  phoneNo: {
    type: String,
    required: [true, "Phone number is required"],
    unique: true,
    validate: {
      validator: function (value) {
        return validator.isMobilePhone(value, 'any');
      },
      message: "Invalid phone number"
    }
  },
  about: {
    type: String,
    trim: true
  },
   status: { type: String, enum: ["online", "offline"], default: "offline" },
  
}, { timestamps: true });

// 2. Chat Schema
const chatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  unreadMessages: {
    sender: { type: Number, default: 0 },
    receiver: { type: Number, default: 0 }
  }

,

  chatTime: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });



const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  messageText: {
    type: String,
    trim: true,
  },
  voiceMessage: { // new field for VM
    type: String, // store Base64 string
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Custom validator to require at least text or voice
messageSchema.pre("validate", function(next) {
  if (!this.messageText && !this.voiceMessage) {
    next(new Error("Message cannot be empty"));
  } else {
    next();
  }
});

const createAllSchemas = async () => {
  try {
    await mongoose.model("User", userSchema);
    await mongoose.model("Chat", chatSchema);
    await mongoose.model("Message", messageSchema);
    console.log("All schemas created successfully");
  } catch (error) {
    console.error("Error creating schemas:", error.message);
  }
};

module.exports = {
  createAllSchemas,
  User: mongoose.model("User", userSchema),
  Chat: mongoose.model("Chat", chatSchema),
  Message: mongoose.model("Message", messageSchema)
};

