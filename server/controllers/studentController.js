import Student from "../models/Student.js";
import Schedule from "../models/Schedule.js";
import Attendance from "../models/Attendance.js";
import FeeStructure from "../models/FeeStructure.js";
import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";
import Notice from "../models/Notice.js";
import StudyMaterial from "../models/StudyMaterial.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { logAction } from "../configs/logger.js"; 

export const loginStudent = async (req, res) => {
  try {
    const { adno, password } = req.body;
    if (!adno || !password) return res.status(400).json({ success: false, message: "Admission Number and password are required" });

    const student = await Student.findOne({ adno: adno.trim() }).lean();
    if (!student) {
      await logAction({ actionType: 'AUTH_FAILURE', title: 'Student Login Failed', message: `Invalid attempt ADNO: ${adno}`, status: 'Failed' });
      return res.status(404).json({ success: false, message: "Account not found for this Admission Number." });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      await logAction({ actionType: 'AUTH_FAILURE', title: 'Student Login Failed', message: `Wrong password for ADNO: ${adno}`, actor: { userId: student._id, role: 'Student', name: student.name }, status: 'Failed' });
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: student._id, role: "STUDENT" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAction({ actionType: 'LOGIN', title: 'Student Login Success', message: `${student.name} logged in.`, actor: { userId: student._id, role: 'Student', name: student.name, ipAddress: req.ip } });

    return res.status(200).json({
      success: true, message: "Login successful",
      student: { id: student._id, name: student.name, adno: student.adno, rollno: student.rollno, grade: student.grade, section: student.section, image: student.image },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutStudent = async (req, res) => {
  await logAction({ actionType: 'LOGOUT', title: 'Student Logged Out', actor: { userId: req.userId, role: 'Student', ipAddress: req.ip } });
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "strict" });
  return res.status(200).json({ success: true, message: "Logout successful" });
};

export const addStudent = async (req, res) => {
  try {
    const { grade, section, rollno, mail, adno } = req.body;
    
    if (adno) {
      const existingAdno = await Student.findOne({ adno: adno.trim() });
      if (existingAdno) return res.status(400).json({ success: false, message: "Admission Number is already registered." });
    }

    const existingStudent = await Student.findOne({ grade, section, rollno });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: `Roll Number ${rollno} is already assigned in Class ${grade} Section ${section}` });
    }

    if (mail) {
      const existingMail = await Student.findOne({ mail: mail.toLowerCase().trim() });
      if (existingMail) return res.status(400).json({ success: false, message: "This email address is already registered." });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "saints_students", resource_type: "image" }, 
          (error, result) => { if (error) reject(error); else resolve(result.secure_url); }
        );
        stream.end(req.file.buffer);
      });
    }

    const studentData = { ...req.body };
    if (imageUrl) studentData.image = imageUrl;
    
    if (typeof req.body.father === 'string') studentData.father = JSON.parse(req.body.father);
    if (typeof req.body.mother === 'string') studentData.mother = JSON.parse(req.body.mother);
    if (typeof req.body.guardian === 'string') studentData.guardian = JSON.parse(req.body.guardian);
    if (typeof req.body.address === 'string') studentData.address = JSON.parse(req.body.address);
    if (typeof req.body.transport === 'string') studentData.transport = JSON.parse(req.body.transport);
    if (typeof req.body.documentsSubmitted === 'string') studentData.documentsSubmitted = JSON.parse(req.body.documentsSubmitted);

    const student = new Student(studentData);
    await student.save();

    await logAction({ actionType: 'CREATE', title: 'Student Enrolled', message: `Enrolled ${student.name} (${grade}-${section}, AdNo: ${adno})`, actor: { userId: req.userId, role: 'Admin', name: req.admin.name } });

    res.status(201).json({ success: true, message: "Student enrolled successfully", student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    } else {
      delete req.body.password;
    }

    if (req.body.adno) {
      const adnoConflict = await Student.findOne({ adno: req.body.adno.trim(), _id: { $ne: id } });
      if (adnoConflict) return res.status(400).json({ success: false, message: "This Admission Number is already in use." });
    }

    if (req.body.mail) {
        const mailConflict = await Student.findOne({ mail: req.body.mail.toLowerCase().trim(), _id: { $ne: id } });
        if (mailConflict) return res.status(400).json({ success: false, message: "This email is already in use by another student." });
    }

    if (req.file) {
      req.body.image = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "saints_students", resource_type: "image" }, 
          (error, result) => { if (error) reject(error); else resolve(result.secure_url); }
        );
        stream.end(req.file.buffer);
      });
    }

    const updateData = { ...req.body };
    
    if (typeof req.body.father === 'string') updateData.father = JSON.parse(req.body.father);
    if (typeof req.body.mother === 'string') updateData.mother = JSON.parse(req.body.mother);
    if (typeof req.body.guardian === 'string') updateData.guardian = JSON.parse(req.body.guardian);
    if (typeof req.body.address === 'string') updateData.address = JSON.parse(req.body.address);
    if (typeof req.body.transport === 'string') updateData.transport = JSON.parse(req.body.transport);
    if (typeof req.body.documentsSubmitted === 'string') updateData.documentsSubmitted = JSON.parse(req.body.documentsSubmitted);

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedStudent) return res.status(404).json({ success: false, message: "Student not found" });

    await logAction({ actionType: 'UPDATE', title: 'Student Updated', message: `Updated profile for ${updatedStudent.name}`, actor: { userId: req.userId, role: 'Admin', name: req.admin.name } });

    res.status(200).json({ success: true, message: "Student updated successfully", student: updatedStudent });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Duplicate data error: Roll No, Email, or AdNo already exists." });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    if (student.image) {
      const urlParts = student.image.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `saints_students/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId).catch(err => console.log("Cloudinary cleanup error", err));
    }

    await Student.findByIdAndDelete(id);

    await logAction({ actionType: 'DELETE', title: 'Student Deleted', message: `Removed ${student.name} from system`, actor: { userId: req.userId, role: 'Admin', name: req.admin.name } });
    res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentFullSchedule = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const schedule = await Schedule.findOne({ grade: student.grade, section: student.section })
      .populate("weeklySchedule.periods.teacherId", "name mail phno image")
      .lean();

    const fullWeek = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };

    if (schedule && schedule.weeklySchedule) {
      schedule.weeklySchedule.forEach(dayNode => {
        const dayName = dayNode.dayOfWeek;
        if (fullWeek[dayName]) {
          dayNode.periods.forEach(period => {
            fullWeek[dayName].push({
              _id: period._id, subject: period.subject, periodIndex: period.periodNumber, 
              time: `${period.startTime} - ${period.endTime}`, room: period.room || "TBA",
              teacherName: period.teacherId?.name || "Unassigned", teacherPhone: period.teacherId?.phno || "N/A", 
              teacherEmail: period.teacherId?.mail || "N/A", teacherImage: period.teacherId?.image || ""
            });
          });
        }
      });
    }

    Object.keys(fullWeek).forEach(day => fullWeek[day].sort((a, b) => a.periodIndex - b.periodIndex));
    res.status(200).json({ success: true, schedule: fullWeek });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).select("-password").lean(); 
    res.status(200).json({
      success: true,
      settings: {
        profile: student 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { mail, transport } = req.body; 
    const updatedStudent = await Student.findByIdAndUpdate(req.userId, { mail, transport }, { new: true, runValidators: true }).lean();
    if (!updatedStudent) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ success: false, message: 'Provide all fields' });
    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'New passwords do not match' });

    const student = await Student.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });

    student.password = newPassword; 
    await student.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 🚨 FIXED: Added examTerm to the populate string to retrieve correct exam titles
export const getMyResults = async (req, res) => {
  try {
    const results = await ExamResult.find({ studentId: req.userId })
      .populate("examId", "examTerm title subject examDate maxMarks")
      .populate("teacherId", "name")
      .lean();
    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentNotices = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const notices = await Notice.find({
      $or: [
        { type: "Global" },
        { type: "Class", targetGrade: student.grade, targetSection: student.section }
      ]
    }).sort({ createdAt: -1 }).lean();
    
    res.status(200).json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentStudyMaterials = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const materials = await StudyMaterial.find({ grade: student.grade, section: student.section })
        .populate("uploadedBy", "name")
        .sort({ createdAt: -1 }).lean();
        
    res.status(200).json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.userId;
    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const scheduleDoc = await Schedule.findOne({ grade: student.grade, section: student.section }).populate("weeklySchedule.periods.teacherId", "name").lean();

    let todaySchedule = [];
    if (scheduleDoc && scheduleDoc.weeklySchedule) {
      const dayData = scheduleDoc.weeklySchedule.find(d => d.dayOfWeek === today);
      if (dayData) {
        todaySchedule = dayData.periods.map(p => ({
          _id: p._id, subject: p.subject, time: `${p.startTime} - ${p.endTime}`,
          teacherName: p.teacherId?.name || "Unassigned", room: p.room || "TBA"
        }));
      }
    }

    const recentNotices = await Notice.find({
      $or: [{ type: "Global" }, { type: "Class", targetGrade: student.grade, targetSection: student.section }]
    }).sort({ createdAt: -1 }).limit(3).lean();

    const currentYear = new Date().getFullYear();
    const cleanGrade = student.grade.replace(/class/i, '').trim();
    const classId = `${cleanGrade}-${student.section.trim()}`;

    const yearRecords = await Attendance.find({
      classId,
      date: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
      }
    }).lean();

    const absencesByDate = {};
    const uniqueDays = new Set();
    
    yearRecords.forEach(r => {
      const dStr = new Date(r.date).toISOString().split('T')[0];
      uniqueDays.add(dStr);
      if (r.absentees && r.absentees.map(a => a.toString()).includes(studentId.toString())) {
        absencesByDate[dStr] = (absencesByDate[dStr] || 0) + 1;
      }
    });

    let absentHalf = 0, absentFull = 0;
    Object.values(absencesByDate).forEach(count => {
      if (count === 1) absentHalf++;
      if (count >= 2) absentFull++;
    });

    const totalWorkingDays = uniqueDays.size;
    const presentDays = totalWorkingDays - (absentHalf * 0.5) - absentFull;
    const attendancePercentage = totalWorkingDays > 0 ? Number(((presentDays / totalWorkingDays) * 100).toFixed(1)) : 100;

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: student.name, adno: student.adno, rollno: student.rollno, grade: student.grade, section: student.section,
          image: student.image, attendance: { percentage: attendancePercentage }, feeDetails: student.feeDetails
        },
        todaySchedule, recentNotices, currentDay: today
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.userId;
    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;
    const cleanGrade = student.grade.replace(/class/i, '').trim();
    const classId = `${cleanGrade}-${student.section.trim()}`;

    const allRecords = await Attendance.find({
      classId,
      date: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
      }
    }).sort({ date: -1 }).lean();

    const history = allRecords.slice(0, 30).map(record => {
      const isAbsent = record.absentees && record.absentees.map(a => a.toString()).includes(studentId.toString());
      return { 
        _id: record._id, 
        date: record.date, 
        session: record.session, 
        status: isAbsent ? "Absent" : "Present" 
      };
    });

    const calcStats = (recordsArray) => {
      const absencesByDate = {};
      const uniqueDays = new Set();

      recordsArray.forEach(r => {
          const dStr = new Date(r.date).toISOString().split('T')[0];
          uniqueDays.add(dStr);
          const isAbsent = r.absentees && r.absentees.map(a => a.toString()).includes(studentId.toString());
          if (isAbsent) {
              absencesByDate[dStr] = (absencesByDate[dStr] || 0) + 1;
          }
      });

      let absentHalf = 0;
      let absentFull = 0;

      Object.values(absencesByDate).forEach(count => {
          if (count === 1) absentHalf++;
          if (count >= 2) absentFull++;
      });

      const totalWorkingDays = uniqueDays.size; 
      const presentDays = totalWorkingDays - (absentHalf * 0.5) - absentFull;
      const percentage = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 100;

      return { 
        totalWorkingDays, 
        presentDays, 
        absentHalf, 
        absentFull, 
        percentage: Number(percentage.toFixed(1)) 
      };
    };

    const monthlyRecords = allRecords.filter(r => new Date(r.date).getUTCMonth() + 1 === currentMonthNum);

    res.status(200).json({ 
      success: true, 
      summary: { 
        monthly: calcStats(monthlyRecords), 
        yearly: calcStats(allRecords) 
      }, 
      history 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentExamSchedule = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const cleanGrade = student.grade.replace(/class/i, '').trim();
    
    const exams = await Exam.find({ 
      grade: { $in: [student.grade, cleanGrade, `Class ${cleanGrade}`] }, 
      section: { $in: [student.section, "All"] } 
    }).sort({ examDate: 1 }).lean(); 

    res.status(200).json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import Report from "../models/Report.js";
export const getStudentReports = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const reports = await Report.find({
      status: 'Completed', sentTo: { $in: ['Student', 'All'] },
      $or: [
        { targetGrade: null }, 
        { targetGrade: student.grade, targetSection: student.section }, 
        { targetGrade: student.grade, targetSection: null } 
      ]
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentFees = async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const masterFee = await FeeStructure.findOne({ grade: student.grade }).lean();
    const targetTotalAmount = masterFee ? masterFee.totalFee : 0;

    if (!student.feeDetails || student.feeDetails.totalAmount !== targetTotalAmount) {
      const currentPaid = student.feeDetails?.paidAmount || 0;
      student.feeDetails = {
        totalAmount: targetTotalAmount, paidAmount: currentPaid, dueAmount: Math.max(0, targetTotalAmount - currentPaid)
      };
      await student.save();
    }

    const history = student.feeHistory ? student.feeHistory.sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
    res.status(200).json({ success: true, feeDetails: student.feeDetails, feeHistory: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).select("-password").lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({
      success: true,
      profile: student 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};