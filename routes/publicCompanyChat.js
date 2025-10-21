// routes/publicCompanyChat.js
import express from "express";
import axios from "axios";
import Company from "../models/company.js";

const router = express.Router();

/**
 * 🧠 Chat with AI using specific company API key
 */
router.post("/chat", async (req, res) => {
  try {
    const { companyApiKey, prompt } = req.body;

    if (!companyApiKey || !prompt)
      return res.status(400).json({ success: false, error: "Missing parameters" });

    // ✅ احضار الشركة بناءً على الـ API Key
    const company = await Company.findOne({ apiKey: companyApiKey });
    if (!company)
      return res.status(404).json({ success: false, error: "Invalid company API key" });

    // 🧩 بناء سياق الذكاء الصناعي من بيانات الشركة
    const context = `
      أنت مساعد ذكي تمثل شركة "${company.name}".
      المجال: ${company.industry || "غير محدد"}.
      وصف الشركة: ${company.description || "لا يوجد وصف"}.
      الرؤية: ${company.vision || "غير محددة"}.
      الرسالة: ${company.mission || "غير محددة"}.
      القيم: ${(company.values || []).join(", ") || "غير محددة"}.
      تحدث بالعربية وكأنك ممثل حقيقي للشركة.
    `;

    // ✅ إرسال الطلب لموديل OpenRouter باستخدام مفتاح AiThor الأساسي فقط
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct-v0.2",
        messages: [
          { role: "system", content: context },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 400,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, // مفتاح شركتك الرئيسي فقط
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      response.data?.choices?.[0]?.message?.content ||
      "لم يتم الحصول على رد من الذكاء الاصطناعي.";

    res.json({
      success: true,
      company: company.name,
      reply,
    });
  } catch (err) {
    console.error("🔥 AI Chat Error:", {
      message: err.message,
      response: err.response?.data,
    });
    res.status(500).json({
      success: false,
      error: "AI service error",
      details: err.response?.data || err.message,
    });
  }
});

/**
 * 🏢 Fetch company info by API key
 */
router.get("/company/:apiKey", async (req, res) => {
  try {
    const { apiKey } = req.params;
    const company = await Company.findOne({ apiKey });

    if (!company) return res.status(404).json({ success: false });
    res.json({ success: true, company });
  } catch (err) {
    console.error("Fetch company error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
