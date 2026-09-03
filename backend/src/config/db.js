import mongoose from "mongoose";
import dotenv from "dotenv";
import { ENV } from "./env.js";

dotenv.config();

export const connectMongoose = async () => {
  try {
    const connectDB = await mongoose.connect(ENV.MONGO_URI);
    console.log(`connectMongoose:`, connectDB.connection.host);
  } catch (error) {
    console.log("error in connectMongoose", error);
  }
};
