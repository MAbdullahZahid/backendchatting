const {User} = require("./schema");
const bcrypt = require("bcrypt");

const checkuserexists = async (username, phoneNo) => {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) return true;
    const phoneNoExists = await User.findOne({ phoneNo });
    if (phoneNoExists) return true;
    return false;
}


const createUser = async (userdata) => {
    const { name, username, password, phoneNo, about } = userdata;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const newUser = new User({
        name,
        username,
        password: hashedPassword,
        phoneNo,
        about
    });

   
    return await newUser.save();
}

module.exports= {checkuserexists, createUser};