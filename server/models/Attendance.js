import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    classId: { type: String, required: true }, // Still linked to Grade-Section
    date: { 
      type: Date, 
      required: true,
      set: d => {
        const date = new Date(d);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    grade: { type: String, required: true },
    section: { type: String, required: true },
    session: { type: String, enum: ["FN", "AN"], required: true }, // 🚨 NEW: Forenoon or Afternoon
    absentees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
  },
  { timestamps: true }
);

// 🚨 UPDATED: Unique index now includes the session so we can have 2 records per day per class
attendanceSchema.index({ classId: 1, date: 1, session: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);