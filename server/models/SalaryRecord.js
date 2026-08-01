import mongoose from "mongoose";

const salaryRecordSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    academicYear: { type: String, required: true },
    month: { type: String, required: true }, 
    year: { type: String, required: true },
    
    totalDays: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },
    leavesTaken: {
      halfDays: { type: Number, default: 0 },
      fullDays: { type: Number, default: 0 },
      totalLeaveDays: { type: Number, default: 0 } 
    },
    
    payrollData: {
      basic: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      ca: { type: Number, default: 0 },
      grossTotal: { type: Number, default: 0 },
      
      lossOfPay: { type: Number, default: 0 },
      calculatedTotal: { type: Number, default: 0 }, 
      
      mngEpf: { type: Number, default: 0 },
      mngEsi: { type: Number, default: 0 },
      empEpf: { type: Number, default: 0 },
      empEsi: { type: Number, default: 0 },
      profTax: { type: Number, default: 0 },
      netAmount: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['Generated', 'Paid'], default: 'Generated' },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("SalaryRecord", salaryRecordSchema);