import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
  {
    // 🚨 Removed unique: true from adno as requested
    adno: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    grade: { type: String, required: true, enum: ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
    section: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    rollno: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },

    studentIdNumber: { type: String, default: "" },
    image: { type: String, default: "" }, 
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    age: { type: Number },
    bloodGroup: { type: String, default: "" },
    aadhaarNumber: { type: String, default: "" },
    nationality: { type: String, default: "Indian" },
    religion: { type: String, default: "" },
    caste: { type: String, default: "" }, 
    motherTongue: { type: String, default: "" },

    father: {
      name: { type: String, default: "" },
      aadhaarNumber: { type: String, default: "" },
      mobile: { type: String, default: "" }, 
      occupation: { type: String, default: "" },
      annualIncome: { type: Number },
      email: { type: String, default: "" }
    },

    mother: {
      name: { type: String, default: "" },
      aadhaarNumber: { type: String, default: "" },
      mobile: { type: String, default: "" },
      occupation: { type: String, default: "" },
      annualIncome: { type: Number },
      email: { type: String, default: "" }
    },

    guardian: {
      name: { type: String, default: "" },
      relationship: { type: String, default: "" },
      aadhaarNumber: { type: String, default: "" },
      mobile: { type: String, default: "" },
      occupation: { type: String, default: "" },
      address: { type: String, default: "" }
    },

    address: {
      houseNumber: { type: String, default: "" },
      street: { type: String, default: "" },
      villageCity: { type: String, default: "" },
      mandal: { type: String, default: "" },
      district: { type: String, default: "" },
      state: { type: String, default: "" },
      pinCode: { type: String, default: "" }
    },

    dateOfAdmission: { type: Date },
    previousSchool: { type: String, default: "" },
    tcNumber: { type: String, default: "" },
    mediumOfInstruction: { type: String, default: "English" },
    firstLanguage: { type: String, default: "" },
    secondLanguage: { type: String, default: "" },
    houseClub: { type: String, default: "" },
    mail: { type: String, lowercase: true, trim: true },

    transport: {
      required: { type: Boolean, default: false },
      busRouteNumber: { type: String, default: "" },
      driverContact: { type: String, default: "" }
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

    feeDetails: {
      totalAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      dueAmount: { type: Number, default: 0 },
      concessionDetails: { type: String, default: "" }
    },

    feeHistory: [{
      amount: { type: Number },
      date: { type: Date, default: Date.now },
      method: { type: String },
      remarks: { type: String },
      collectedBy: { type: String }
    }],

    isDetained: { type: Boolean, default: false },

    documentsSubmitted: {
      birthCertificate: { type: Boolean, default: false },
      studentAadhaarCopy: { type: Boolean, default: false },
      fatherAadhaarCopy: { type: Boolean, default: false },
      motherAadhaarCopy: { type: Boolean, default: false },
      photos: { type: Boolean, default: false },
      transferCertificate: { type: Boolean, default: false },
      studyCertificate: { type: Boolean, default: false },
      casteCertificate: { type: Boolean, default: false },
      incomeCertificate: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

// 🚨 Removed the studentSchema.index compound unique constraint

studentSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

// 🚨 Programmatically attempt to drop the old unique indexes
Student.collection.dropIndex('adno_1').catch(() => {});
Student.collection.dropIndex('grade_1_section_1_rollno_1').catch(() => {});

export default Student;