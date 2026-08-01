import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    grade: { 
      type: String, 
      required: true, 
      unique: true,
      enum: ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] 
    },
    tuitionFee: { type: Number, required: true },
    facilityFee: { type: Number, default: 0 },
    totalFee: { type: Number, required: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

// Triggers on standard .save()
feeStructureSchema.pre("save", function (next) {
  this.totalFee = Number(this.tuitionFee) + Number(this.facilityFee || 0);
  next();
});

// Triggers on .findOneAndUpdate() used by Admin Controllers
feeStructureSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.tuitionFee !== undefined || update.facilityFee !== undefined) {
    const tuition = Number(update.tuitionFee) || 0;
    const facility = Number(update.facilityFee) || 0;
    // Inject the calculated total automatically
    update.totalFee = tuition + facility; 
  }
  next();
});

export default mongoose.model("FeeStructure", feeStructureSchema);