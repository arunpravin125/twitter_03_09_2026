import express from "express";
import { connectMongoose } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { ENV } from "./config/env.js";
import cors from "cors";
import { userRoutes } from "./routes/user.route.js";
import { postRoutes } from "./routes/post.route.js";
import { commentRoutes } from "./routes/comment.route.js";
import { notificationRoutes } from "./routes/notification.route.js";
import { arcjetMiddleware } from "./middlewares/arcjet.middleware.js";

export const app = express();

const PORT = ENV.PORT || 3011;
const missingClerkEnv = [];

if (!ENV.CLERK_PUBLISHABLE_KEY) missingClerkEnv.push("CLERK_PUBLISHABLE_KEY");
if (!ENV.CLERK_SECRET_KEY) missingClerkEnv.push("CLERK_SECRET_KEY");

if (missingClerkEnv.length > 0) {
  console.error(
    "Missing Clerk environment variables:",
    missingClerkEnv.join(", "),
  );
}

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  const isHealthCheck = ["/", "/health", "/favicon.ico"].includes(req.path);

  if (missingClerkEnv.length === 0 || isHealthCheck) {
    return next();
  }

  return res.status(500).json({
    error: "Server misconfiguration",
    message: "Missing required Clerk environment variables.",
    missingEnv: missingClerkEnv,
  });
});

if (missingClerkEnv.length === 0) {
  app.use(clerkMiddleware());
  console.log("Clerk middleware enabled.");
}

app.use(arcjetMiddleware);

app.get(["/", "/health"], (req, res) => {
  console.log("Health api");
  res.json({
    status: "ok",
    message: "Hellow from Server",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notification", notificationRoutes);

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: error?.message || "Internal server error",
  });
});

const startServer = async () => {
  try {
    if (ENV.MONGO_URI) {
      await connectMongoose();
      console.log("MongoDB initialization complete.");
    } else {
      console.warn("MONGODB_URI is not set. Skipping MongoDB connection.");
    }

    if (!process.env.VERCEL && ENV.NODE_ENV !== "production") {
      app.listen(PORT, () => {
        console.log("Server started on port", PORT);
      });
    } else if (process.env.VERCEL) {
      console.log(
        "Vercel runtime detected. The Express app will be exported for serverless invocation.",
      );
    }
  } catch (error) {
    console.error("Server startup error:", error?.message || error);
  }
};

startServer();
