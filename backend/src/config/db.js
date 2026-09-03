import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongoose = async () => {
  try {
    const connectDB = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`connectMongoose:`, connectDB.connection.host);
  } catch (error) {
    console.log("error in connectMongoose", error);
  }
};
