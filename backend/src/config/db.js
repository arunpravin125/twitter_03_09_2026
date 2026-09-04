import mongoose from "mongoose";
import { ENV } from "./env.js";

const connectionState = {
  promise: null,
};

export const connectMongoose = async () => {
  if (!ENV.MONGO_URI) {
    console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
    return null;
  }

  // Already connected
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected.");
    return mongoose.connection;
  }

  // Connection is already being established
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
