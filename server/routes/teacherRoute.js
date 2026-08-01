import express from "express";
import {
  loginTeacher,
  logoutTeacher,
  addTeacher,
  getTeacherSchedule,
  markAttendance,
  getSectionAnalytics,
  notifyDefaultersEmail,
  updateTeacherProfile,
  uploadResults,
  updateStudentResult,
  deleteStudentResult,
  getExamsForTeacher,
  uploadStudyMaterial,
  getStudyMaterialsForTeacher,
  deleteStudyMaterial,
  createClassNotice,
  getTeacherNotices,
  getStudentsByClass,
  getTeacherDashboard,
  getResultsByExam,
  getReceivedAdminNotices,
  getTeacherProfile,
  getScheduleByDay,
  getAttendanceRecord,
  getMyAttendanceStats,
  changePassword,
  sendAttendanceAlerts,
  getClassAttendanceReport,
  // 🚨 NEW IMPORTS
  getAssignedClasses,
  getClassExamTerms,
  getClassResultMatrix,
  getStudentResultsByLookup
} from "../controllers/teacherController.js";

import { teacherAuth } from "../middlewares/authTeacher.js"; 
import { adminAuth } from "../middlewares/authAdmin.js"; 
import { upload } from "../configs/multer.js";
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: "Too many attempts, please try again after 15 minutes." }
});

const teacherRouter = express.Router();

teacherRouter.post("/login", loginLimiter, loginTeacher);
teacherRouter.get("/is-auth", teacherAuth, (req, res) => res.json({ success: true })); 
teacherRouter.post("/logout", teacherAuth, logoutTeacher);
teacherRouter.put("/update", teacherAuth, upload.single("image"), updateTeacherProfile);
teacherRouter.put("/update-password", teacherAuth, changePassword);

teacherRouter.get('/schedule', teacherAuth, getTeacherSchedule);
teacherRouter.post("/attendance/mark", teacherAuth, markAttendance);
teacherRouter.post("/attendance/send-alerts", teacherAuth, sendAttendanceAlerts);
teacherRouter.get("/analytics", teacherAuth, getSectionAnalytics);
teacherRouter.get("/attendance/report", teacherAuth, getClassAttendanceReport);
teacherRouter.get("/dashboard", teacherAuth, getTeacherDashboard);
teacherRouter.post("/notify-defaulters", teacherAuth, notifyDefaultersEmail);
teacherRouter.get('/students', teacherAuth, getStudentsByClass);

teacherRouter.get("/results/exam/:examId", teacherAuth, getResultsByExam);
teacherRouter.get("/profile", teacherAuth, getTeacherProfile);
teacherRouter.get("/attendance/my-stats", teacherAuth, getMyAttendanceStats);

teacherRouter.get("/exams", teacherAuth, getExamsForTeacher);
teacherRouter.post("/results/upload", teacherAuth, uploadResults);
teacherRouter.put("/results/update/:resultId", teacherAuth, updateStudentResult);
teacherRouter.delete("/results/delete/:resultId", teacherAuth, deleteStudentResult);

teacherRouter.post("/study-material/upload", teacherAuth, upload.single("file"), uploadStudyMaterial);
teacherRouter.get("/study-material/all", teacherAuth, getStudyMaterialsForTeacher);
teacherRouter.delete("/study-material/delete/:id", teacherAuth, deleteStudyMaterial);

teacherRouter.post("/notice/create", teacherAuth, createClassNotice);
teacherRouter.get("/notice/all", teacherAuth, getTeacherNotices);
teacherRouter.get("/reports/received", teacherAuth, getReceivedAdminNotices);

teacherRouter.get("/schedule/day", teacherAuth, getScheduleByDay);
teacherRouter.get("/attendance/record", teacherAuth, getAttendanceRecord);

teacherRouter.post("/add", adminAuth, upload.single("image"), addTeacher);

// 🚨 NEW ROUTES FOR MY CLASS MODULE
teacherRouter.get("/my-class/assignments", teacherAuth, getAssignedClasses);
teacherRouter.get("/my-class/exam-terms", teacherAuth, getClassExamTerms);
teacherRouter.get("/my-class/matrix", teacherAuth, getClassResultMatrix);
teacherRouter.get("/my-class/student-lookup", teacherAuth, getStudentResultsByLookup);

export default teacherRouter;