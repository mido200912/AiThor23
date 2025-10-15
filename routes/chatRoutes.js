import express from "express";
import axios from "axios";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/company.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;

    // جلب بيانات الشركة الخاصة بالمستخدم
    const company = await Company.findOne({ owner: req.user._id });

    // توليد النص المرسل للذكاء الاصطناعي
    const context = company
      ? `You are an assistant representing a company called "${company.name}". 
         Industry: ${company.industry || "N/A"}.
         Description: ${company.description || "No description"}.
         Vision: ${company.vision || "No vision"}.
         Mission: ${company.mission || "No mission"}.
         Company values: ${(company.values || []).join(", ") || "No values"}.
         Respond to customers naturally, based only on this data.`
      : "You are a general business assistant.";

    // إرسال الطلب إلى OpenRouter
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct", // نموذج مجاني ومتاح
        messages: [
          { role: "system", content: context },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "لم أتمكن من الرد حالياً.";
    res.json({ reply });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "AI service error" });
  }
});

export default router;
