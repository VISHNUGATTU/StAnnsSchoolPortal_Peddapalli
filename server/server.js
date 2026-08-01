import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import dns from "dns";
dotenv.config();
import connectDB from "./configs/db.js";
import connectCloudinary from "./configs/cloudinary.js";

import adminRouter from "./routes/adminRoute.js";
import teacherRouter from "./routes/teacherRoute.js"; 
import studentRouter from "./routes/studentRoute.js";
import reportRouter from "./routes/reportRoute.js";
import logRouter from "./routes/logRoute.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

await connectDB();
connectCloudinary();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🏫 Saints High School API is running smoothly!"
  });
});

app.use("/api/admin", adminRouter);
app.use("/api/teacher", teacherRouter); 
app.use("/api/student", studentRouter);
app.use("/api/reports", reportRouter);
app.use("/api/logs", logRouter);

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});