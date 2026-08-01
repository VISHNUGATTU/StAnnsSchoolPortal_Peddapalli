import express from "express";
import {
  loginAdmin,
  isAdminAuth,
  logoutAdmin,
  updateAdminProfile,
  verifyAdminPassword,
  promoteStudents,
  getSystemHealth,
  getTeacherCount,
  addScheduleSlot,
  deleteScheduleSlot,
  getClassSchedule,
  verifyBatchEnterPassword,
  createExam,
  updateExam,
  deleteExam,
  getAllExams,
  markTeacherAttendance,
  getTeacherAttendance,
  createNotice,
  getNotices,
  deleteNotice,
  getAllTeachers,
  deleteTeacherById,
  updateTeacherById,
  getSchedule,
  saveWeeklySchedule,
  getExamSchedule,
  saveExamSchedule,
  getFeeStructures, 
  setFeeStructure,
  getStudentFeeDetails,
  collectFeePayment,
  checkUserExistence,
  getAvailableTeachersForClass, 
  assignClassTeacher,
  getClassTeacherAssignments,
  removeClassTeacherAssignment,
  getSalaryReports, 
  resetSalaryData,
  // 🚨 NEW SETTINGS EXPORTS
  updateAcademicYearSettings,
  getAcademicYearSettings
} from "../controllers/adminController.js";

import { adminAuth } from "../middlewares/authAdmin.js";
import { upload } from "../configs/multer.js";
import Student from "../models/Student.js"; 
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: "Too many attempts, please try again after 15 minutes." }
});

const adminRouter = express.Router();

adminRouter.post("/login", loginLimiter, loginAdmin);
adminRouter.post("/check-id", checkUserExistence);
adminRouter.post("/verify-batch-password", adminAuth, loginLimiter, verifyBatchEnterPassword);
adminRouter.get("/is-auth", adminAuth, isAdminAuth);
adminRouter.post("/logout", adminAuth, logoutAdmin);
adminRouter.put("/update", adminAuth, upload.single("image"), updateAdminProfile);
adminRouter.post("/verify-passwords", adminAuth, loginLimiter, verifyAdminPassword);

adminRouter.get("/available-class-teachers", adminAuth, getAvailableTeachersForClass);
adminRouter.post("/assign-class-teacher", adminAuth, assignClassTeacher);
adminRouter.get("/class-teacher-assignments", adminAuth, getClassTeacherAssignments);
adminRouter.delete("/assign-class-teacher/:id", adminAuth, removeClassTeacherAssignment);

adminRouter.put("/promote-batch", adminAuth, promoteStudents);
adminRouter.get("/health", adminAuth, getSystemHealth);
adminRouter.get("/teacher-count", adminAuth, getTeacherCount); 

adminRouter.get('/students/all', adminAuth, async (req, res) => {
  try {
    const students = await Student.find().sort({ grade: 1, section: 1 });
    res.status(200).json({ success: true, students: students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error while fetching students" });
  }
});

adminRouter.post("/schedule/add", adminAuth, addScheduleSlot);
adminRouter.delete("/schedule/delete", adminAuth, deleteScheduleSlot);
adminRouter.get("/schedule", adminAuth, getClassSchedule);
adminRouter.post("/schedule/save-week", adminAuth, saveWeeklySchedule);

adminRouter.post("/exam/create", adminAuth, createExam);
adminRouter.put("/exam/update/:id", adminAuth, updateExam);
adminRouter.delete("/exam/delete/:id", adminAuth, deleteExam);
adminRouter.get("/exam/all", adminAuth, getAllExams);
adminRouter.get("/exams/schedule", adminAuth, getExamSchedule);
adminRouter.post("/exams/schedule/save", adminAuth, saveExamSchedule);

adminRouter.post("/teacher-attendance/mark", adminAuth, markTeacherAttendance);
adminRouter.get("/teacher-attendance/view", adminAuth, getTeacherAttendance);

adminRouter.get("/teachers/all", adminAuth, getAllTeachers);
adminRouter.delete("/teacher/delete/:id", adminAuth, deleteTeacherById);

adminRouter.put("/teacher/update/:id", adminAuth, upload.single("image"), updateTeacherById);

adminRouter.post("/notice/create", adminAuth, createNotice);
adminRouter.get("/notice/all", adminAuth, getNotices);
adminRouter.delete("/notice/delete/:id", adminAuth, deleteNotice);

adminRouter.get("/fees/structure", adminAuth, getFeeStructures);
adminRouter.post("/fees/structure/set", adminAuth, setFeeStructure);
adminRouter.get("/fees/student", adminAuth, getStudentFeeDetails);
adminRouter.post("/fees/pay", adminAuth, collectFeePayment);

adminRouter.post("/students/promote", adminAuth, promoteStudents);

adminRouter.get("/salaries/reports", adminAuth, getSalaryReports);
adminRouter.post("/salaries/reset", adminAuth, resetSalaryData);

// 🚨 NEW ROUTES FOR SYSTEM SETTINGS
adminRouter.get("/settings/academic-year", adminAuth, getAcademicYearSettings);
adminRouter.post("/settings/academic-year", adminAuth, updateAcademicYearSettings);

export default adminRouter;