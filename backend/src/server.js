import express from "express";
import dotenv from "dotenv";
import { connectMongoose } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { ENV } from "./config/env.js";
import cors from "cors";
import { userRoutes } from "./routes/user.route.js";
import { postRoutes } from "./routes/post.route.js";
import { commentRoutes } from "./routes/comment.route.js";
import { notificationRoutes } from "./routes/notification.route.js";
import { arcjetMiddleware } from "./middlewares/arcjet.middleware.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.use(arcjetMiddleware);
const PORT = ENV.PORT || 3011;

app.get("/", (req, res) => res.send("Hellow from Server"));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notification", notificationRoutes);

//  error handling middleware

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const startServer = async () => {
  await connectMongoose();
  try {
    app.listen(PORT, () => {
      console.log("Server started...", PORT);
    });
  } catch (error) {
    console.log("error in start server", error.message);
    process.exit(1);
  }
};

startServer();
