import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["Global", "Class"], required: true },
    targetGrade: { type: String, default: null },
    targetSection: { type: String, default: null },
    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      role: { type: String, enum: ["Admin", "Teacher"], required: true },
      name: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Notice", noticeSchema);