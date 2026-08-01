import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    examTerm: { type: String, required: true, trim: true }, // E.g., "Mid-Term Examination" (Replaced 'title')
    grade: { 
      type: String, 
      required: true,
      enum: ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] 
    },
    section: { 
      type: String, 
      enum: ["A", "B", "C", "D", "All"], 
      default: "All" 
    },
    subject: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true },
    
    // --- Added for Scheduling ---
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: "" },
    
    // --- Existing Fields ---
    maxMarks: { type: Number, default: 100 }, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: false }
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);