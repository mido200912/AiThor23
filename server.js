import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import companyRoutes from "./routes/Company.js";
import publicCompanyChatRoutes from "./routes/publicCompanyChat.js";

dotenv.config();
const app = express();

// ✅ السماح لأي موقع بالوصول إلى الـ API
app.use(cors({
  origin: "*", // ← هذا يسمح لأي دومين يستخدم الـ API
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/public", publicCompanyChatRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("AiThor API is running 🚀");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
