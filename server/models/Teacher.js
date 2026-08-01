import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    teacherId: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    mail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    designation: { type: String, required: true },
    image: { type: String, default: "" }, 
    phno: { type: String, required: true },
    
    payroll: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      qualification: { type: String, default: "" },
      dateOfJoining: { type: Date },
      dateOfPermanentAppt: { type: Date },
      scaleCode: { type: String, default: "" },
      sgbtSa: { type: String, default: "" },
      scale: { type: String, default: "" },
      
      basic: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      ca: { type: Number, default: 0 },
      gross: { type: Number, default: 0 },
      
      mngEpf: { type: Number, default: 0 },
      mngEsi: { type: Number, default: 0 },
      empEpf: { type: Number, default: 0 },
      empEsi: { type: Number, default: 0 },
      profTax: { type: Number, default: 0 },
      
      netAmount: { type: Number, default: 0 }
    },

    attendanceSummary: {
      monthly: {
        totalHalfDays: { type: Number, default: 0 },
        absentHalfDays: { type: Number, default: 0 },
        absentFullDays: { type: Number, default: 0 }
      },
      yearly: {
        totalHalfDays: { type: Number, default: 0 },
        absentHalfDays: { type: Number, default: 0 },
        absentFullDays: { type: Number, default: 0 }
      }
    },
  },
  { timestamps: true }
);

teacherSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("Teacher", teacherSchema);