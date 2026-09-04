import mongoose from "mongoose";
import dotenv from "dotenv";
import { ENV } from "./env.js";

dotenv.config();

export const connectMongoose = async () => {
  if (!ENV.MONGO_URI) {
    console.warn("MONGODB_URI is not set. Skipping MongoDB connection.");
    return false;
  }

  try {
    const connectDB = await mongoose.connect(ENV.MONGO_URI);
    console.log(`connectMongoose:`, connectDB.connection.host);
    return true;
  } catch (error) {
    console.log("error in connectMongoose", error);
    return false;
  }
};
