// dbconnection/dbConnection.js
const mongoose = require("mongoose");
require("dotenv").config();

const mongoURL = process.env.MONGO_URL;

const connectDB = async () => {
  console.log("______________Mongo URL", mongoURL);
  
  try {
    await mongoose.connect(mongoURL, {
      serverApi: { version: '1', strict: true, deprecationErrors: true },
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. MongoDB connected successfully ✅");

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
