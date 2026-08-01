import mongoose from "mongoose";

const periodSchema = new mongoose.Schema({
  periodNumber: { type: Number, required: true },
  subject: { type: String, required: true },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Teacher", 
    required: true 
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  // 🚨 FIXED: Added room property to schema so MongoDB stops deleting it
  room: { type: String, default: "TBA" } 
});

const daySchema = new mongoose.Schema({
  dayOfWeek: { 
    type: String, 
    required: true,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  },
  periods: [periodSchema]
});

const scheduleSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
      enum: ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    },
    section: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D"],
    },
    weeklySchedule: [daySchema] 
  },
  { timestamps: true }
);

scheduleSchema.index({ grade: 1, section: 1 }, { unique: true });

export default mongoose.model("Schedule", scheduleSchema);