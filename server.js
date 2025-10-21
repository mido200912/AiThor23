import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import companyRoutes from "./routes/Company.js";
import publicCompanyChat from "./routes/publicCompanyChat.js";
import publicCompanyChatRoutes from "./routes/publicCompanyChat.js";


dotenv.config();
const app = express();

// CORS: فقط للفرونت اند
app.use(cors());


app.use(express.json());

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/company", companyRoutes);

app.use("/api/public", publicCompanyChatRoutes);
// Default route
app.get("/", (req, res) => {
  res.send("AiThor API is running");
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
