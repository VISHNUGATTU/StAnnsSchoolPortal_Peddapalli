import mongoose from "mongoose";

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    grade: { type: String, required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    fileUrl: { type: String },
    link: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("StudyMaterial", studyMaterialSchema);