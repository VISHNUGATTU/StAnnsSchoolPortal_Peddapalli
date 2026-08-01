import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mail: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }, 
    adminId: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default mongoose.model("Admin", adminSchema);