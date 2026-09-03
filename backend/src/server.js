import express from "express";
import dotenv from "dotenv";
import { connectMongoose } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { ENV } from "./config/env.js";
import cors from "cors";
import { userRoutes } from "./routes/user.route.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
const PORT = ENV.PORT || 3011;

app.get("/", (req, res) => res.send("Hellow from Server"));

app.use("/api/users", userRoutes);

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
