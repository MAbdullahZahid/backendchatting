const jwt = require("jsonwebtoken");
const { findUserByUsernameOrPhone, comparePassword } = require("../model/loginModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; 

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body; 

        if (!identifier || !password) {
            return res.status(400).json({ message: "Please provide username/phone and password" });
        }

        const user = await findUserByUsernameOrPhone(identifier);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect Password" });
        }

       
        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: "12h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            userId: user._id
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { login };