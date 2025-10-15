import express from "express";
import Company from "../models/company.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// إنشاء أو تحديث بيانات الشركة
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

    const company = await Company.create({ ...req.body, owner: req.user._id });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// الحصول على بيانات الشركة الخاصة بالمستخدم
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// عرض جميع الطلبات المسجلة من العملاء
router.get("/requests", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company.requests || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف طلب محدد من السجل
router.delete("/requests/:index", requireAuth, async (req, res) => {
  try {
    const { index } = req.params;
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    company.requests.splice(index, 1);
    await company.save();
    res.json({ success: true, requests: company.requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// endpoint عام لتسجيل طلبات العملاء عبر apiKey
router.post("/external-request", async (req, res) => {
  try {
    const { apiKey, customerName, product, message } = req.body;

    const company = await Company.findOne({ apiKey });
    if (!company) return res.status(403).json({ error: "Invalid API key" });

    company.requests.push({ customerName, product, message });
    await company.save();

    res.json({ success: true, message: "Request saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
