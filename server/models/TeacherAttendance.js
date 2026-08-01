import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      set: d => {
        const date = new Date(d);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    },
    session: {
      type: String,
      enum: ["FN", "AN"],
      required: true
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    }
  },
  { timestamps: true }
);

teacherAttendanceSchema.index({ teacherId: 1, date: 1, session: 1 }, { unique: true });

export default mongoose.model("TeacherAttendance", teacherAttendanceSchema);