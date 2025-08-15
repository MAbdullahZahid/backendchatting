const express = require("express");
const router = express.Router();
const { getMessagesByChatId } = require("../controllers/messageController");

router.get("/chat-by-chatid", getMessagesByChatId);

module.exports = router;
