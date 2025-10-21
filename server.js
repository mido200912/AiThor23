import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import companyRoutes from "./routes/Company.js";
import publicCompanyChat from "./routes/publicCompanyChat.js";

dotenv.config();
const app = express();

// ✅ قائمة الدومينات المسموح بها
const allowedOrigins = [
  "https://aithor2.vercel.app",
  "http://localhost:3000"
];

// ✅ إعداد CORS متكامل
app.use(
  cors({
    origin: function (origin, callback) {
      // السماح للطلبات بدون origin (زي Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ التعامل مع Preflight requests
app.options("*", cors());

// ✅ ميدل وير مهم
app.use(express.json());

// ✅ Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/public", publicCompanyChat);

// ✅ اتصال قاعدة البيانات
mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb+srv://aismart:mido927010@cluster0.k3yeysv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// ✅ Route اختبار
app.get("/", (req, res) => {
  res.send("Aithor API is running ✅");
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
