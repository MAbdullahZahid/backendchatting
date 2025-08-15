const { User } = require("./schema");
const bcrypt = require("bcrypt");

const findUserByUsernameOrPhone = async (identifier) => {
    return await User.findOne({
        $or: [{ username: identifier }, { phoneNo: identifier }]
    });
};

const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { findUserByUsernameOrPhone, comparePassword };