import mongoose from "mongoose";
const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });
    
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Forces the server to restart if the DB fails
  }
};
export default connectDB;