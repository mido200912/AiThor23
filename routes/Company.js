import express from "express";
import axios from "axios";
import crypto from "crypto";
import Company from "../models/company.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyApiKey } from "../middleware/verifyApiKey.js";

const router = express.Router();

/*-------------------------------
  إنشاء أو تحديث بيانات الشركة
-------------------------------*/
router.post("/", requireAuth, async (req, res) => {
  try {
    const existing = await Company.findOne({ owner: req.user._id });

    if (existing) {
      const updated = await Company.findOneAndUpdate(
        { owner: req.user._id },
        req.body,
        { new: true }
      );
      return res.json(updated);
    }

    const apiKey = crypto.randomBytes(24).toString("hex");
    const company = await Company.create({
      ...req.body,
      owner: req.user._id,
      apiKey,
      requests: [],
    });

    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  الحصول على بيانات الشركة
-------------------------------*/
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  جلب جميع الطلبات
-------------------------------*/
router.get("/requests", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company.requests || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  حذف طلب محدد
-------------------------------*/
router.delete("/requests/:index", requireAuth, async (req, res) => {
  try {
    const { index } = req.params;
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    if (index < 0 || index >= company.requests.length)
      return res.status(400).json({ error: "Invalid request index" });

    company.requests.splice(index, 1);
    await company.save();

    res.json({ success: true, requests: company.requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  جلب الـ API Key للشركة
-------------------------------*/
router.get("/apikey", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json({ apiKey: company.apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*-------------------------------
  استقبال طلبات العملاء من API خارجي
  وتشغيل الذكاء الاصطناعي تلقائياً
-------------------------------*/
router.post("/external-request", async (req, res) => {
  try {
    const { apiKey, customerName, product, message } = req.body;

    if (!apiKey || !message)
      return res
        .status(400)
        .json({ error: "apiKey and message are required" });

    const company = await Company.findOne({ apiKey });
    if (!company) return res.status(403).json({ error: "Invalid API key" });

    // بناء السياق الخاص بالشركة
    let context = `You are an AI assistant representing the company "${company.name}".`;
    if (company.industry) context += ` Industry: ${company.industry}.`;
    if (company.description) context += ` Description: ${company.description}.`;
    if (company.vision) context += ` Vision: ${company.vision}.`;
    if (company.mission) context += ` Mission: ${company.mission}.`;
    context += ` Respond in Arabic, using a professional and helpful tone.`;

    // إرسال الطلب إلى نموذج الذكاء الاصطناعي عبر OpenRouter
    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: context },
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      aiResponse.data.choices?.[0]?.message?.content ||
      "عذرًا، لم أتمكن من معالجة الطلب الآن.";

    // حفظ الطلب والرد في قاعدة البيانات
    company.requests.push({
      customerName,
      product,
      message,
      aiReply: reply,
      date: new Date(),
    });
    await company.save();

    res.json({
      success: true,
      company: company.name,
      reply,
    });
  } catch (err) {
    console.error("External request error:", err.response?.data || err.message);
    res.status(500).json({
      error: "حدث خطأ أثناء معالجة الطلب عبر الذكاء الاصطناعي",
    });
  }
});
router.post("/use-model", verifyApiKey, async (req, res) => {
  try {
    const { prompt } = req.body;
    const { company } = req;

    const responseText = `تم استقبال طلبك: "${prompt}" من الشركة ${company.name}`;
    company.requests.push({
      customerName: "عميل API خارجي",
      product: "API Interaction",
      message: prompt,
      aiReply: responseText,
      date: new Date(),
    });
    await company.save();

    res.json({ success: true, reply: responseText });
  } catch (err) {
    console.error("use-model error:", err.message);
    res.status(500).json({ error: "خطأ أثناء تشغيل النموذج" });
  }
});

export default router;
