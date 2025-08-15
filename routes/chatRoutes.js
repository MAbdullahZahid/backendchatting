const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// Get all chats for a user
router.get("/contacts/:userId", chatController.getUserContacts);

// Find or create a chat by phone number
router.post("/find-or-create", chatController.findOrCreateChat);

module.exports = router;
