import express from "express";
import dotenv from "dotenv";
import { connectMongoose } from "./config/db.js";
import { ENV } from "./config/env.js";

const app = express();
dotenv.config();
app.use(express.json());
const PORT = ENV.PORT || 3011;

app.listen(PORT, () => {
  console.log("Server started...", PORT);
  connectMongoose();
});
