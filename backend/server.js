import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("ERP API Running...");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});