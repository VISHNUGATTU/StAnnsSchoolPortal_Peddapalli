import express from "express";
import {
  loginStudent,
  logoutStudent,
  getStudentFullSchedule,
  getSettings,
  updateProfile,
  updatePassword,
  addStudent,
  updateStudentById,
  deleteStudentById,
  getMyResults,
  getStudentNotices,
  getStudentStudyMaterials,
  getStudentDashboard,
  getMyAttendance,
  getStudentExamSchedule,
  getStudentReports,
  getStudentFees,
  getProfile
} from "../controllers/studentController.js";

import { studentAuth } from "../middlewares/authStudent.js";
import { adminAuth } from "../middlewares/authAdmin.js";
import { upload } from "../configs/multer.js";
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: "Too many attempts, please try again after 15 minutes." }
});

const studentRouter = express.Router();

studentRouter.post("/login", loginLimiter, loginStudent);
studentRouter.post("/logout", studentAuth, logoutStudent);
studentRouter.get("/is-auth", studentAuth, (req, res) => res.json({ success: true }));

studentRouter.get("/schedule", studentAuth, getStudentFullSchedule);
studentRouter.get("/profile", studentAuth, getProfile);
studentRouter.get("/settings", studentAuth, getSettings);
studentRouter.get("/dashboard", studentAuth, getStudentDashboard);
studentRouter.get("/reports", studentAuth, getStudentReports);
studentRouter.put("/update-profile", studentAuth, updateProfile);
studentRouter.put("/update-password", studentAuth, updatePassword);
studentRouter.get("/my-results", studentAuth, getMyResults);
studentRouter.get("/attendance", studentAuth, getMyAttendance);
studentRouter.get("/notices", studentAuth, getStudentNotices);
studentRouter.get("/study-materials", studentAuth, getStudentStudyMaterials);
studentRouter.get("/exam-schedule", studentAuth, getStudentExamSchedule);
studentRouter.get("/fees", studentAuth, getStudentFees);

studentRouter.post("/add", adminAuth, upload.single("image"), addStudent);
// 🚨 STABILITY FIX: Added Multer middleware to parse nested FormData and images
studentRouter.put("/update/:id", adminAuth, upload.single("image"), updateStudentById); 
studentRouter.delete("/delete/:id", adminAuth, deleteStudentById); 

export default studentRouter;