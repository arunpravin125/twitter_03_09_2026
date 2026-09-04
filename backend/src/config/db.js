import mongoose from "mongoose";
import dotenv from "dotenv";
import { ENV } from "./env.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const connectionState = {
  promise: null,
};

export const connectMongoose = async () => {
  if (!ENV.MONGO_URI) {
    console.warn("MONGODB_URI is not set. Skipping MongoDB connection.");
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected.");
    return mongoose.connection;
  }

  if (!connectionState.promise) {
    connectionState.promise = mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
  }

  try {
    const connection = await connectionState.promise;
    console.log("MongoDB connected:", connection.connection.host);
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message || error);
    connectionState.promise = null;
    throw error;
  }
};
