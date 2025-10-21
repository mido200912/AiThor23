import mongoose from "mongoose";

const CompanyChatSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true },
    user: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("CompanyChat", CompanyChatSchema);
