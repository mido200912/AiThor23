// routes/publicCompanyChat.js
import express from "express";
import axios from "axios";
import Company from "../models/company.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { companyApiKey, prompt } = req.body;
    if (!companyApiKey || !prompt)
      return res.status(400).json({ error: "Missing parameters" });

    const company = await Company.findOne({ apiKey: companyApiKey });
    if (!company) return res.status(404).json({ error: "Invalid company API key" });

    const context = `
      You are a support assistant for "${company.name}".
      Industry: ${company.industry || "N/A"}.
      Description: ${company.description || "N/A"}.
      Vision: ${company.vision || "N/A"}.
      Mission: ${company.mission || "N/A"}.
      Values: ${(company.values || []).join(", ") || "N/A"}.
      Respond professionally as a representative of this company.
    `;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: context },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "No response.";
    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "AI service error" });
  }
});

export default router;
