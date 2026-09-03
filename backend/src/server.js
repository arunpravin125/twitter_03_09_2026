import express from "express";
import dotenv from "dotenv";
import { connectMongoose } from "./config/db.js";
import { ENV } from "./config/env.js";

const app = express();
dotenv.config();
app.use(express.json());
const PORT = ENV.PORT || 3011;

app.get("/", (req, res) => res.send("Hellow from Server"));

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
