import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Schedule from "../models/Schedule.js";
import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";
import TeacherAttendance from "../models/TeacherAttendance.js";
import Attendance from "../models/Attendance.js"; 
import Notice from "../models/Notice.js";
import ClassTeacherAssignment from "../models/ClassTeacherAssignment.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { logAction } from "../configs/logger.js"; 

const settingsSchema = new mongoose.Schema({
  configId: { type: String, default: "global", unique: true },
  academicYearStart: { type: Date },
  academicYearEnd: { type: Date }
});
const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);


export const loginAdmin = async (req, res) => {
  try {
    const { mail, password } = req.body;
    if (!mail || !password) return res.status(400).json({ success: false, message: "Missing credentials" });

    const admin = await Admin.findOne({ mail }).lean();
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid admin credentials" });

    const token = jwt.sign({ id: admin._id, role: "ADMIN" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json({ success: true, message: "Admin login successful", role: "admin" });
  } catch (error) {
    res.status(500).json({ success: false, message: "An internal server error occurred." }); 
  }
};

export const isAdminAuth = async (req, res) => {
  try {
    const admin = await Admin.findById(req.userId).select("-password").lean();
    if (!admin) return res.json({ success: false, message: "Admin not found" });
    return res.json({ success: true, admin });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "strict" });
    return res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.userId; 
    const { name, phone, mail } = req.body;
    
    const orConditions = [];
    if (phone && phone.trim() !== "") orConditions.push({ phone: phone.trim() });
    if (mail && mail.trim() !== "") orConditions.push({ mail: mail.trim().toLowerCase() });

    if (orConditions.length > 0) {
      const conflictCheck = await Admin.findOne({ $or: orConditions, _id: {$ne: adminId } }).lean();
      if (conflictCheck) {
        if (conflictCheck.phone === phone?.trim()) return res.status(409).json({ success: false, message: "Phone number already in use" });
        if (conflictCheck.mail === mail?.trim().toLowerCase()) return res.status(409).json({ success: false, message: "Email already in use" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (mail) updateData.mail = mail.trim().toLowerCase();

    if (req.file) {
      updateData.image = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "saints_admin", resource_type: "image" }, (error, result) => { 
          if (error) reject(error); else resolve(result.secure_url); 
        });
        stream.end(req.file.buffer);
      });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, { new: true }).select("-password").lean();
    return res.json({ success: true, message: "Profile updated successfully", admin: updatedAdmin });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const verifyAdminPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: "Password required" });

    const admin = await Admin.findById(req.userId).select("password name").lean(); 
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect Password" });
    res.json({ success: true, message: "Admin verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyBatchEnterPassword = async (req, res) => {
  try {
    const { password } = req.body; 
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect Master Password" });
    res.status(200).json({ success: true, message: "Verification successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

export const promoteStudents = async (req, res) => {
  try {
    const { studentIds, targetGrade, targetSection, resetTeacherAttendance } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !targetGrade || !targetSection) {
      return res.status(400).json({ success: false, message: "Missing required promotion data." });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    const eligibleIds = [];
    const blockedStudents = [];

    students.forEach(student => {
      const hasDueFees = student.feeDetails && student.feeDetails.dueAmount > 0;
      const isDetained = student.isDetained === true || student.status === 'Detained';

      if (hasDueFees || isDetained) {
        blockedStudents.push({ id: student._id, name: student.name, rollno: student.rollno, reason: hasDueFees ? `Pending fee balance of ₹${student.feeDetails.dueAmount}` : "Student is marked as detained" });
      } else {
        eligibleIds.push(student._id);
      }
    });

    if (eligibleIds.length === 0) {
      return res.status(400).json({ success: false, message: "Promotion failed. All selected students have pending dues or are detained.", blockedDetails: blockedStudents });
    }

    const result = await Student.updateMany(
      { _id: { $in: eligibleIds } },
      { $set: { 
        grade: targetGrade, section: targetSection, 
        "attendanceSummary.monthly": { totalHalfDays: 0, absentHalfDays: 0, absentFullDays: 0 },
        "attendanceSummary.yearly": { totalHalfDays: 0, absentHalfDays: 0, absentFullDays: 0 },
        "feeDetails.totalAmount": 0, "feeDetails.paidAmount": 0, "feeDetails.dueAmount": 0, isDetained: false 
      }}
    );

    if (resetTeacherAttendance) {
        await TeacherAttendance.deleteMany({});
    }

    res.status(200).json({ success: true, message: `Successfully promoted ${result.modifiedCount} students.`, summary: { promotedCount: result.modifiedCount, blockedCount: blockedStudents.length, blockedDetails: blockedStudents } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    const start = Date.now();
    if (mongoose.connection.readyState !== 1) throw new Error("Database not connected");
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ success: true, database: 'connected', latency: Date.now() - start, schoolEngine: 'operational', storageEngine: 'operational' });
  } catch (error) {
    res.status(500).json({ success: false, database: 'disconnected', latency: 0 });
  }
};

export const getTeacherCount = async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const designationDistribution = await Teacher.aggregate([
      { $group: { _id: "$designation", count: { $sum: 1 } } },
      { $project: { designation: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } } 
    ]);
    res.status(200).json({ totalTeachers, designationCount: designationDistribution.length, designationData: designationDistribution });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const addScheduleSlot = async (req, res) => {
  try {
    const { grade, section, dayOfWeek, periodNumber, subject, teacherId, startTime, endTime, room } = req.body;
    if (!grade || !section || !dayOfWeek || !periodNumber || !subject || !teacherId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "All fields are required to assign a period." });
    }

    const teacherExists = await Teacher.findById(teacherId).lean();
    if (!teacherExists) return res.status(404).json({ success: false, message: "Selected Teacher not found." });

    let schedule = await Schedule.findOne({ grade, section });
    const newPeriod = { periodNumber: Number(periodNumber), subject, teacherId, startTime, endTime, room };

    if (!schedule) {
      schedule = new Schedule({ grade, section, weeklySchedule: [{ dayOfWeek, periods: [newPeriod] }] });
      await schedule.save();
    } else {
      const dayIndex = schedule.weeklySchedule.findIndex(d => d.dayOfWeek === dayOfWeek);
      if (dayIndex === -1) {
        schedule.weeklySchedule.push({ dayOfWeek, periods: [newPeriod] });
      } else {
        const periodIndex = schedule.weeklySchedule[dayIndex].periods.findIndex(p => p.periodNumber === Number(periodNumber));
        if (periodIndex === -1) {
          schedule.weeklySchedule[dayIndex].periods.push(newPeriod);
        } else {
          schedule.weeklySchedule[dayIndex].periods[periodIndex] = newPeriod;
        }
      }
      await schedule.save();
    }
    res.status(200).json({ success: true, message: "Schedule slot saved successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteScheduleSlot = async (req, res) => {
  try {
    const { grade, section, dayOfWeek, periodId } = req.body;
    if (!grade || !section || !dayOfWeek || !periodId) return res.status(400).json({ success: false, message: "Missing required parameters." });

    const result = await Schedule.updateOne(
      { grade, section, "weeklySchedule.dayOfWeek": dayOfWeek },
      { $pull: { "weeklySchedule.$.periods": { _id: periodId } } }
    );
    if (result.modifiedCount === 0) return res.status(404).json({ success: false, message: "Slot not found or already deleted." });
    res.status(200).json({ success: true, message: "Slot removed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveWeeklySchedule = async (req, res) => {
  try {
    const { grade, section, weeklyData } = req.body;
    if (!grade || !section || !weeklyData) return res.status(400).json({ success: false, message: "Missing required schedule data" });

    const formattedWeeklySchedule = weeklyData.map(dayData => ({
      dayOfWeek: dayData.day,
      periods: dayData.periods.map((period, index) => ({
        periodNumber: parseInt(period.periodName) || (index + 1),
        subject: period.subject, 
        startTime: period.startTime, 
        endTime: period.endTime, 
        teacherId: period.teacherId ? period.teacherId : null,
        room: period.room 
      }))
    }));

    await Schedule.findOneAndUpdate({ grade, section }, { weeklySchedule: formattedWeeklySchedule }, { upsert: true, new: true });
    res.status(200).json({ success: true, message: "Weekly schedule saved to database successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassSchedule = async (req, res) => {
  try {
    const { grade, section } = req.query;
    if (!grade || !section) return res.status(400).json({ success: false, message: "Grade and Section are required." });

    const schedule = await Schedule.findOne({ grade, section }).populate("weeklySchedule.periods.teacherId", "name").lean();
    if (!schedule) return res.status(200).json({ success: true, schedules: [] });

    const formattedWeeklyData = schedule.weeklySchedule.map(dayData => ({
      day: dayData.dayOfWeek,
      periods: dayData.periods.sort((a, b) => a.periodNumber - b.periodNumber).map(p => ({
          periodName: p.periodNumber.toString(), subject: p.subject, startTime: p.startTime, endTime: p.endTime,
          teacherId: p.teacherId ? p.teacherId._id : "", teacherName: p.teacherId ? p.teacherId.name : "",
          room: p.room || "" 
        }))
    }));

    res.status(200).json({ success: true, schedules: formattedWeeklyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const { title, grade, section, subject, examDate } = req.body;
    if (!title || !grade || !section || !subject || !examDate) return res.status(400).json({ success: false, message: "All fields required" });

    const exam = await Exam.create({ title, grade, section, subject, examDate, createdBy: req.userId });
    res.status(201).json({ success: true, message: "Exam scheduled successfully", exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
    res.status(200).json({ success: true, message: "Exam updated", exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
    await ExamResult.deleteMany({ examId: id });
    res.status(200).json({ success: true, message: "Exam and related results deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const { grade, section } = req.query;
    let query = {};
    if (grade) query.grade = grade;
    if (section) query.section = section;
    const exams = await Exam.find(query).sort({ examDate: -1 }).lean();
    res.status(200).json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, date, status, session } = req.body;
    if (!teacherId || !date || !status || !session) return res.status(400).json({ success: false, message: "Required fields missing" });

    const now = new Date();
    const currentHour = now.getHours();
    
    if (session === "FN" && currentHour < 8) {
      return res.status(403).json({ success: false, message: "Forenoon session not started. Available from 8:00 AM." });
    }
    if (session === "AN" && currentHour < 12) {
      return res.status(403).json({ success: false, message: "Afternoon session not started. Available from 12:00 PM." });
    }

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const existingRecord = await TeacherAttendance.findOne({ teacherId, date: d, session });
    const adminId = req.admin ? req.admin._id : req.userId;

    if (existingRecord) {
      existingRecord.status = status;
      existingRecord.markedBy = adminId;
      await existingRecord.save();
    } else {
      await TeacherAttendance.create({ teacherId, date: d, session, status, markedBy: adminId });
    }

    res.status(200).json({ success: true, message: `Teacher ${session} attendance recorded.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherAttendance = async (req, res) => {
  try {
    if (!req.query.date || !req.query.session) return res.status(400).json({ success: false, message: "Date and Session required" });
    const d = new Date(req.query.date);
    d.setUTCHours(0, 0, 0, 0);

    const records = await TeacherAttendance.find({ date: d, session: req.query.session }).populate("teacherId", "name teacherId designation").lean();
    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { title, content, type, targetGrade, targetSection } = req.body;
    if (!title || !content || !type) return res.status(400).json({ success: false, message: "Title, content, and type are required." });

    const admin = req.admin; 
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized. Admin details missing." });

    const newNotice = new Notice({
      title, content, type,
      targetGrade: type === 'Class' ? targetGrade : null,
      targetSection: type === 'Class' ? targetSection : null,
      createdBy: { userId: admin._id, role: "Admin", name: admin.name }
    });

    await newNotice.save();
    res.status(201).json({ success: true, message: "Notice created successfully.", notice: newNotice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const deletedNotice = await Notice.findByIdAndDelete(req.params.id);
    if (!deletedNotice) return res.status(404).json({ success: false, message: "Notice not found." });
    res.status(200).json({ success: true, message: "Notice deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().select("-password").sort({ name: 1 }).lean();
    
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;
    
    const allAttendance = await TeacherAttendance.find({
        date: {
            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
        }
    }).lean();

    const updatedTeachers = teachers.map(t => {
        const teacherRecords = allAttendance.filter(r => r.teacherId.toString() === t._id.toString());
        
        const calcLeaves = (records) => {
            const byDate = {};
            const uniqueDays = new Set();
            
            records.forEach(r => {
                const dStr = new Date(r.date).toISOString().split('T')[0];
                uniqueDays.add(dStr);
                if (r.status === "Absent") {
                    byDate[dStr] = (byDate[dStr] || 0) + 1;
                }
            });

            let h = 0, f = 0;
            Object.values(byDate).forEach(c => { 
                if(c === 1) h++; 
                if(c >= 2) f++; 
            });

            const totalWorkingDays = uniqueDays.size;
            return { absentHalfDays: h, absentFullDays: f, totalHalfDays: totalWorkingDays }; 
        };

        const monthRecords = teacherRecords.filter(r => new Date(r.date).getUTCMonth() + 1 === currentMonthNum);

        // 🚨 NEW: Compute Base Payroll explicitly without leave deductions for Profile Views
        const p = t.payroll || {};
        const basic = parseFloat(p.basic) || 0;
        const da = parseFloat(p.da) || 0;
        const hra = parseFloat(p.hra) || 0;
        const ca = parseFloat(p.ca) || 0;
        const grossTotal = parseFloat(p.gross) || (basic + da + hra + ca);

        const mngEpf = grossTotal * 0.12;
        const mngEsi = grossTotal * 0.0325;
        const empEpf = grossTotal * 0.12;
        const empEsi = grossTotal * 0.0075;

        let profTax = 0;
        if (grossTotal > 15000 && grossTotal <= 20000) profTax = 150;
        else if (grossTotal > 20000) profTax = 200;

        const netAmount = grossTotal - empEpf - empEsi - profTax;

        const computedPayroll = {
            ...p,
            gross: grossTotal,
            mngEpf: parseFloat(mngEpf.toFixed(2)),
            mngEsi: parseFloat(mngEsi.toFixed(2)),
            empEpf: parseFloat(empEpf.toFixed(2)),
            empEsi: parseFloat(empEsi.toFixed(2)),
            profTax: profTax,
            netAmount: parseFloat(netAmount.toFixed(2))
        };
        
        return {
            ...t,
            payroll: computedPayroll, // 🚨 Pass computed payroll payload natively
            attendanceSummary: {
                monthly: calcLeaves(monthRecords),
                yearly: calcLeaves(teacherRecords)
            }
        };
    });

    res.status(200).json({ success: true, teachers: updatedTeachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    if (teacher.image) {
      const urlParts = teacher.image.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `saints_teachers/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }

    await Teacher.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mail, phone, designation, address, bloodGroup, password, payroll } = req.body;
    
    const updatePayload = {};
    if (name) updatePayload.name = name.trim();
    if (mail) updatePayload.mail = mail.trim().toLowerCase();
    if (phone) updatePayload.phone = phone.trim();
    if (designation) updatePayload.designation = designation.trim();
    if (address) updatePayload.address = address.trim();
    if (bloodGroup) updatePayload.bloodGroup = bloodGroup;

    if (payroll) {
        updatePayload.payroll = typeof payroll === 'string' ? JSON.parse(payroll) : payroll;
    }

    if (password) updatePayload.password = await bcrypt.hash(password, 10);

    const updatedTeacher = await Teacher.findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true }).select("-password");
    if (!updatedTeacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    res.status(200).json({ success: true, message: "Teacher updated successfully", teacher: updatedTeacher });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Teacher ID or Email already exists." });
    res.status(500).json({ success: false, message: "Server error during update" });
  }
};

export const getSchedule = async (req, res) => {
  try {
    const { grade, section } = req.query;
    if (!grade || !section) return res.status(400).json({ success: false, message: "Grade and Section are required" });

    const schedules = await Schedule.find({ grade, section }).populate('periods.teacherId', 'name designation');
    if (!schedules || schedules.length === 0) return res.status(404).json({ success: false, message: "No schedule found" });

    res.status(200).json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveExamSchedule = async (req, res) => {
  try {
    const { examTerm, grade, exams } = req.body;
    if (!examTerm || !grade) return res.status(400).json({ success: false, message: "Missing required schedule data" });

    await Exam.deleteMany({ examTerm, grade });
    if (exams && exams.length > 0) {
      const newExams = exams.map(ex => ({
        examTerm, grade, section: "All", subject: ex.subject, examDate: ex.date,
        startTime: ex.startTime, endTime: ex.endTime, room: ex.room, createdBy: req.adminId,
        maxMarks: ex.maxMarks || 100 
      }));
      await Exam.insertMany(newExams);
    }

    res.status(200).json({ success: true, message: "Exam schedule updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamSchedule = async (req, res) => {
  try {
    const { examTerm, grade } = req.query;
    if (!examTerm || !grade) return res.status(400).json({ success: false, message: "Exam Term and Grade are required" });

    const exams = await Exam.find({ examTerm, grade }).sort({ examDate: 1 });
    if (!exams || exams.length === 0) return res.status(404).json({ success: false, message: "No exams scheduled yet." });

    const formattedSchedule = {
      examTerm, grade,
      exams: exams.map(ex => ({ _id: ex._id, date: ex.examDate, subject: ex.subject, startTime: ex.startTime, endTime: ex.endTime, room: ex.room, maxMarks: ex.maxMarks || 100 }))
    };

    res.status(200).json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import FeeStructure from "../models/FeeStructure.js";
export const getFeeStructures = async (req, res) => {
  try {
    const fees = await FeeStructure.find({});
    res.status(200).json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setFeeStructure = async (req, res) => {
  try {
    const { grade, tuitionFee, facilityFee } = req.body;
    if (!grade || tuitionFee === undefined) return res.status(400).json({ success: false, message: "Grade and Tuition Fee are required." });

    const totalFee = Number(tuitionFee) + Number(facilityFee || 0);
    const updatedFee = await FeeStructure.findOneAndUpdate(
      { grade },
      { tuitionFee, facilityFee: facilityFee || 0, totalFee, lastUpdatedBy: req.adminId },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: `Fee structure for Class ${grade} updated successfully.`, feeStructure: updatedFee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentFeeDetails = async (req, res) => {
  try {
    const { grade, section, studentId, adno } = req.query;

    let query = {};
    if (studentId) {
      query._id = studentId;
    } else if (adno) {
      query.adno = adno.trim();
    } else if (grade && section && req.query.rollno) {
      query = { grade: grade.trim(), section: section.trim(), rollno: req.query.rollno.trim() };
    } else {
      return res.status(400).json({ success: false, message: "Please provide either Student ID, Admission No, or Class/Section/RollNo." });
    }

    const student = await Student.findOne(query);
    if (!student) return res.status(404).json({ success: false, message: "Student not found. Please check the details." });

    const masterFee = await FeeStructure.findOne({ grade: student.grade }).lean();
    const targetTotalAmount = masterFee ? masterFee.totalFee : 0;

    if (!student.feeDetails || student.feeDetails.totalAmount !== targetTotalAmount) {
      const currentPaid = student.feeDetails?.paidAmount || 0;
      student.feeDetails = {
        totalAmount: targetTotalAmount, paidAmount: currentPaid, dueAmount: Math.max(0, targetTotalAmount - currentPaid)
      };
      await student.save();
    }

    const sortedHistory = (student.feeHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ 
      success: true, 
      student: { _id: student._id, name: student.name, adno: student.adno, rollno: student.rollno, grade: student.grade, section: student.section, feeDetails: student.feeDetails, feeHistory: sortedHistory } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const collectFeePayment = async (req, res) => {
  try {
    const { studentId, amount, paymentMethod, remarks } = req.body;

    if (!studentId || !amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: "Valid Student ID and a positive amount are required." });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found in database." });
    if (!student.feeDetails) return res.status(400).json({ success: false, message: "Fee structure not initialized." });

    const paymentAmount = Number(amount);
    if (paymentAmount > student.feeDetails.dueAmount) {
      return res.status(400).json({ success: false, message: `Payment exceeds the current due balance of ₹${student.feeDetails.dueAmount}.` });
    }

    student.feeDetails.paidAmount += paymentAmount;
    student.feeDetails.dueAmount -= paymentAmount;

    const receiptId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transactionDate = new Date();

    student.feeHistory.push({
      amount: paymentAmount, date: transactionDate, method: paymentMethod || 'Cash',
      remarks: remarks || receiptId, collectedBy: req.adminId || req.userId 
    });

    await student.save();

    const sortedHistory = student.feeHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ 
      success: true, 
      message: "Payment processed successfully!", 
      updatedStudent: { ...student.toObject(), feeHistory: sortedHistory },
      receiptData: {
          receiptNumber: receiptId,
          date: transactionDate,
          studentName: student.name,
          admissionNo: student.adno,
          classDetails: `${student.grade} - ${student.section}`,
          amountPaid: paymentAmount,
          paymentMethod: paymentMethod || 'Cash',
          remainingBalance: student.feeDetails.dueAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkUserExistence = async (req, res) => {
  try {
    const { loginId } = req.body;
    if (!loginId) return res.json({ success: false });
    const trimmedId = loginId.trim();

    const admin = await Admin.findOne({ mail: trimmedId.toLowerCase() }).lean();
    if (admin) return res.json({ success: true, role: "admin" });

    const teacher = await Teacher.findOne({ teacherId: trimmedId }).lean();
    if (teacher) return res.json({ success: true, role: "teacher" });

    const student = await Student.findOne({ adno: trimmedId }).lean();
    if (student) return res.json({ success: true, role: "student" });

    return res.json({ success: false, role: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAvailableTeachersForClass = async (req, res) => {
  try {
    const availableTeachers = await Teacher.find({}).select("name teacherId designation").lean();
    res.status(200).json({ success: true, teachers: availableTeachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignClassTeacher = async (req, res) => {
  try {
    const { grade, section, teacherId, academicYear } = req.body;
    
    const existingClassAssignment = await ClassTeacherAssignment.findOne({ grade, section, academicYear });
    if (existingClassAssignment) {
      return res.status(400).json({ success: false, message: `Class ${grade}-${section} already has a class teacher.` });
    }

    await ClassTeacherAssignment.create({ grade, section, teacherId, academicYear });
    res.status(201).json({ success: true, message: "Class Teacher assigned successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassTeacherAssignments = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const assignments = await ClassTeacherAssignment.find({ academicYear })
      .populate('teacherId', 'name')
      .sort({ grade: 1, section: 1 })
      .lean();
    res.status(200).json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeClassTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await ClassTeacherAssignment.findByIdAndDelete(id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    res.status(200).json({ success: true, message: "Class teacher unassigned successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalaryReports = async (req, res) => {
  try {
    const { month, year, type } = req.query; 
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYearNum = new Date().getFullYear();
    
    const teachers = await Teacher.find().select("name teacherId designation payroll").lean();
    
    const allAttendanceRecords = await TeacherAttendance.find({
      date: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    }).lean();
    
    const calculateSalaryData = (teacher, daysInMonth, targetLeaves) => {
      const p = teacher.payroll || {};
      const basic = parseFloat(p.basic) || 0;
      const da = parseFloat(p.da) || 0;
      const hra = parseFloat(p.hra) || 0;
      const ca = parseFloat(p.ca) || 0;
      const grossTotal = parseFloat(p.gross) || (basic + da + hra + ca);

      const perDaySalary = grossTotal / daysInMonth;
      const lossOfPay = targetLeaves * perDaySalary;
      const calculatedTotal = Math.max(0, grossTotal - lossOfPay);

      const mngEpf = calculatedTotal * 0.12;
      const mngEsi = calculatedTotal * 0.0325;
      const empEpf = calculatedTotal * 0.12;
      const empEsi = calculatedTotal * 0.0075;

      let profTax = 0;
      if (calculatedTotal > 15000 && calculatedTotal <= 20000) profTax = 150;
      else if (calculatedTotal > 20000) profTax = 200;

      const netAmount = calculatedTotal - empEpf - empEsi - profTax;

      return {
        basic, da, hra, ca, grossTotal, perDaySalary, lossOfPay, calculatedTotal,
        mngEpf, mngEsi, empEpf, empEsi, profTax, netAmount
      };
    };

    if (type === 'monthly') {
      const targetMonthNum = parseInt(month);
      const targetYearStr = parseInt(year);
      const daysInMonth = new Date(targetYearStr, targetMonthNum, 0).getDate();

      const reports = teachers.map(t => {
        const teacherMonthRecords = allAttendanceRecords.filter(r => 
            r.teacherId.toString() === t._id.toString() && 
            new Date(r.date).getUTCMonth() + 1 === targetMonthNum
        );

        const absencesByDate = {};
        const uniqueDays = new Set();
        
        teacherMonthRecords.forEach(r => {
            const dStr = new Date(r.date).toISOString().split('T')[0];
            uniqueDays.add(dStr);
            if (r.status === "Absent") {
                absencesByDate[dStr] = (absencesByDate[dStr] || 0) + 1;
            }
        });

        let absentHalf = 0;
        let absentFull = 0;

        Object.values(absencesByDate).forEach(count => {
            if (count === 1) absentHalf++;
            if (count >= 2) absentFull++;
        });

        const leaves = (absentHalf * 0.5) + absentFull;
        const salData = calculateSalaryData(t, daysInMonth, leaves);
        
        return {
          teacherId: t.teacherId,
          name: t.name,
          designation: t.designation,
          leaves: { half: absentHalf, full: absentFull, total: leaves },
          salary: salData
        };
      });
      
      reports.sort((a, b) => (b.salary?.netAmount || 0) - (a.salary?.netAmount || 0));
      return res.status(200).json({ success: true, reports });
    } 
    
    if (type === 'cumulative') {
      const targetYear = parseInt(year) || currentYearNum;
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      const reports = teachers.map(t => {
        let yearlyTotalNet = 0;
        let yearlyTotalGross = 0;
        let yearlyTotalLOP = 0;
        let yearlyTotalLeaves = 0;
        const monthlyBreakdown = [];

        const maxMonth = (targetYear === currentYearNum) ? currentMonthNum : 12;
        const teacherYearRecords = allAttendanceRecords.filter(r => r.teacherId.toString() === t._id.toString());

        for (let m = 1; m <= maxMonth; m++) {
          const daysInMonth = new Date(targetYear, m, 0).getDate();
          const monthName = monthNames[m - 1];
          
          const monthRecords = teacherYearRecords.filter(r => new Date(r.date).getUTCMonth() + 1 === m);
          
          const absencesByDate = {};
          const uniqueDays = new Set();
          
          monthRecords.forEach(r => {
              const dStr = new Date(r.date).toISOString().split('T')[0];
              uniqueDays.add(dStr);
              if (r.status === "Absent") {
                  absencesByDate[dStr] = (absencesByDate[dStr] || 0) + 1;
              }
          });

          let absentHalf = 0;
          let absentFull = 0;

          Object.values(absencesByDate).forEach(count => {
              if (count === 1) absentHalf++;
              if (count >= 2) absentFull++;
          });

          const leaves = (absentHalf * 0.5) + absentFull;
          const salData = calculateSalaryData(t, daysInMonth, leaves);

          yearlyTotalNet += salData.netAmount;
          yearlyTotalGross += salData.grossTotal;
          yearlyTotalLOP += salData.lossOfPay;
          yearlyTotalLeaves += leaves;

          monthlyBreakdown.push({
            monthIndex: m,
            monthName: monthName,
            period: `${monthName} ${targetYear}`,
            leaves: { half: absentHalf, full: absentFull, total: leaves },
            salary: salData
          });
        }

        return {
          teacherId: t.teacherId,
          name: t.name,
          designation: t.designation,
          monthlyBreakdown,
          yearlyTotals: {
            netAmount: yearlyTotalNet,
            grossTotal: yearlyTotalGross,
            lossOfPay: yearlyTotalLOP,
            totalLeaves: yearlyTotalLeaves
          }
        };
      });

      reports.sort((a, b) => b.yearlyTotals.netAmount - a.yearlyTotals.netAmount);
      return res.status(200).json({ success: true, reports });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetSalaryData = async (req, res) => {
  try {
    const { type, password, target } = req.body;
    
    const admin = await Admin.findById(req.userId).select("password").lean();
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid Master Password" });

    const resetTarget = target || 'teacher';

    if (resetTarget === 'teacher') {
      if (type === 'monthly' || type === 'cumulative') {
          await TeacherAttendance.deleteMany({});
      }
      return res.status(200).json({ success: true, message: `Teacher salary and attendance records have been successfully wiped.` });
    } 
    
    if (resetTarget === 'student') {
      if (type === 'monthly' || type === 'cumulative') {
          await Attendance.deleteMany({});
      }
      return res.status(200).json({ success: true, message: `Student attendance records have been successfully wiped.` });
    }

    return res.status(400).json({ success: false, message: "Invalid target specified for reset." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAcademicYearSettings = async (req, res) => {
  try {
    const { start, end } = req.body;
    if (!start || !end) return res.status(400).json({ success: false, message: "Start and End dates are required." });

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) return res.status(400).json({ success: false, message: "Start date must be before end date." });

    const updatedSettings = await Settings.findOneAndUpdate(
      { configId: "global" }, 
      { academicYearStart: startDate, academicYearEnd: endDate },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: "Academic year updated successfully.", settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAcademicYearSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({ configId: "global" }).lean();
    if (!settings) {
      const currentYear = new Date().getFullYear();
      return res.status(200).json({ 
        success: true, 
        settings: { 
          academicYearStart: new Date(`${currentYear}-06-01`), 
          academicYearEnd: new Date(`${currentYear + 1}-04-30`) 
        } 
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};