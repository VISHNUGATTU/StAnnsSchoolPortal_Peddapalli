import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  actionType: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String },
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId },
    role: { type: String },
    name: { type: String },
    ipAddress: { type: String },
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
  status: { 
    type: String, 
    enum: ['Success', 'Failed', 'Warning'], 
    default: 'Success' 
  },
  createdAt: { type: Date, default: Date.now } 
});

logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Log", logSchema);