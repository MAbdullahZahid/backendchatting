const router = require("express").Router();
const { getAllUserContacts } = require("../controllers/allContactsController");

router.get("/contacts/:userId", getAllUserContacts);

module.exports = router;
