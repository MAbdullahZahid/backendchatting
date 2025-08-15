const { checkuserexists, createUser } = require("../model/signupModel")
const validator = require("validator");

const signup = async (req, res) => {
    try {
         if (!req.body) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }
        const { name, username, password, phoneNo, about } = req.body;
          if (!name || !username || !password || !phoneNo) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }
        const exists = await checkuserexists(username, phoneNo);
        if (exists) {
            return res.status(409).json({ message: "Username or phone number already exists" });
        }
        if (username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
        }
        if (name.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if (username.includes(' ')) {
            return res.status(400).json({ message: "Username cannot contain spaces" });
        }
        if (password.includes(' ')) {
            return res.status(400).json({ message: "Username cannot contain spaces" });
        }
         if (!validator.isMobilePhone(phoneNo, 'any')) {
            return res.status(400).json({ message: "Invalid phone number" });
        }

        const user = await createUser({ name, username, password, phoneNo, about });
        return res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}
module.exports = { signup };