import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Schedule from "../models/Schedule.js";
import Attendance from "../models/Attendance.js";
import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";
import Notice from "../models/Notice.js";
import Report from "../models/Report.js";
import StudyMaterial from "../models/StudyMaterial.js";
import TeacherAttendance from "../models/TeacherAttendance.js";
import ClassTeacherAssignment from "../models/ClassTeacherAssignment.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from "cloudinary";
import { logAction } from "../configs/logger.js"; 
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export const loginTeacher = async (req, res) => {
  try {
    const { teacherId, password } = req.body;
    const teacher = await Teacher.findOne({ teacherId: teacherId?.trim() }).lean();
    if (!teacher) {
      await logAction({ actionType: 'AUTH_FAILURE', title: 'Teacher Login Failed', message: `Invalid ID: ${teacherId}`, status: 'Failed' });
      return res.json({ success: false, message: "Teacher account not found" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      await logAction({ actionType: 'AUTH_FAILURE', title: 'Teacher Login Failed', message: `Wrong password for ID: ${teacherId}`, actor: { userId: teacher._id, role: 'Teacher', name: teacher.name }, status: 'Failed' });
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: teacher._id, role: "TEACHER" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAction({ actionType: 'LOGIN', title: 'Teacher Login Success', message: `${teacher.name} logged in.`, actor: { userId: teacher._id, role: 'Teacher', name: teacher.name, ipAddress: req.ip } });
    res.json({ success: true, message: "Login successful", teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutTeacher = async (req, res) => {
  try {
    await logAction({ actionType: 'LOGOUT', title: 'Teacher Logged Out', actor: { userId: req.userId, role: 'Teacher', ipAddress: req.ip } });
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "strict" });
    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed", error: error.message });
  }
};

export const addTeacher = async (req, res) => {
  try {
    let { name, teacherId, password, mail, phno, designation, payroll } = req.body;
    if (!name || !password || !teacherId || !mail || !phno || !designation) return res.status(400).json({ success: false, message: "All required core fields are mandatory" });

    mail = mail.trim().toLowerCase();
    const exists = await Teacher.findOne({ $or: [{ teacherId }, { mail }, { phno }] }).lean();
    if (exists) return res.status(400).json({ success: false, message: "Teacher with this ID, Email, or Phone already exists" });

    let imageUrl = "";
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "saints_teachers", resource_type: "auto" }, (error, result) => {
          if (error) reject(error); else resolve(result.secure_url);
        });
        stream.end(req.file.buffer);
      });
    }

    const teacherData = { 
      name: name.trim(), password, teacherId: teacherId.trim(), mail, phno: phno.trim(), designation: designation.trim(), image: imageUrl 
    };
    
    if (payroll) {
        teacherData.payroll = typeof payroll === 'string' ? JSON.parse(payroll) : payroll;
    }

    const teacher = await Teacher.create(teacherData);
    await logAction({ actionType: 'CREATE_USER', title: 'New Teacher Added', message: `Teacher ${name} added by Admin.`, actor: { userId: req.userId, role: 'Admin' } });

    res.status(201).json({ success: true, message: "Teacher added successfully", teacher: { _id: teacher._id, name: teacher.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySchedule = async (req, res) => {
  try {
    const teacherId = req.userId;
    const classrooms = await Schedule.find({ "weeklySchedule.periods.teacherId": teacherId }).lean();
    const grouped = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };

    classrooms.forEach(classroom => {
      classroom.weeklySchedule.forEach(dayNode => {
        const day = dayNode.dayOfWeek;
        dayNode.periods.forEach(period => {
          if (period.teacherId.toString() === teacherId.toString()) {
            grouped[day].push({ _id: period._id, subject: period.subject, time: `${period.startTime} - ${period.endTime}`, grade: classroom.grade, section: classroom.section, periodIndex: period.periodNumber });
          }
        });
      });
    });

    Object.keys(grouped).forEach(day => grouped[day].sort((a, b) => a.periodIndex - b.periodIndex));
    res.json({ success: true, schedule: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { date, attendanceData, grade, section, session } = req.body; 
    const teacherId = req.userId;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    if (session === "FN" && currentHour < 8) {
      return res.status(403).json({ success: false, message: "Forenoon session not started yet. Available from 8:00 AM." });
    }
    if (session === "AN" && currentHour < 12) {
      return res.status(403).json({ success: false, message: "Afternoon session not started yet. Available from 12:00 PM." });
    }

    const cleanGrade = grade.replace(/class/i, '').trim();
    const cleanSection = section.trim();
    const currentYear = now.getFullYear().toString();

    const assignment = await ClassTeacherAssignment.findOne({ 
      grade: { $in: [grade, cleanGrade, `Class ${cleanGrade}`] }, 
      section: cleanSection, 
      teacherId, 
      academicYear: currentYear 
    });
    
    if (!assignment) {
      return res.status(403).json({ success: false, message: "Only the assigned Class Teacher can mark session attendance." });
    }

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const classId = `${cleanGrade}-${cleanSection}`; 
    const newAbsentIds = attendanceData.filter(r => r.status === "Absent").map(r => r.studentId);
    
    const existingRecord = await Attendance.findOne({ classId, date: d, session });
    let isUpdate = !!existingRecord;

    if (isUpdate) {
      existingRecord.absentees = newAbsentIds;
      await existingRecord.save();
    } else {
      await Attendance.create({ classId, date: d, teacherId, grade: cleanGrade, section: cleanSection, session, absentees: newAbsentIds });
    }

    res.json({ success: true, message: isUpdate ? `Updated ${session} attendance!` : `Saved ${session} attendance!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSectionAnalytics = async (req, res) => {
  try {
    const { grade, section } = req.query; 
    if (!grade || !section) return res.status(400).json({ success: false, message: "Params required" });

    const cleanGrade = grade.replace(/class/i, '').trim();
    const classId = `${cleanGrade}-${section.trim()}`;
    const currentYear = new Date().getFullYear();

    const students = await Student.find({ grade: cleanGrade, section: section.trim(), isAlumni: false }).select("name rollno father mail").lean();
    
    const allRecords = await Attendance.find({
      classId,
      date: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
      }
    }).lean();

    const uniqueDaysMap = new Set();
    allRecords.forEach(r => {
        uniqueDaysMap.add(new Date(r.date).toISOString().split('T')[0]);
    });
    const totalWorkingDays = uniqueDaysMap.size;

    const analytics = students.map(student => {
      const studentId = student._id.toString();
      const absencesByDate = {};

      allRecords.forEach(r => {
        if (r.absentees && r.absentees.map(a => a.toString()).includes(studentId)) {
           const dStr = new Date(r.date).toISOString().split('T')[0];
           absencesByDate[dStr] = (absencesByDate[dStr] || 0) + 1;
        }
      });

      let absentHalf = 0, absentFull = 0;
      Object.values(absencesByDate).forEach(count => {
          if (count === 1) absentHalf++;
          if (count >= 2) absentFull++;
      });

      const presentDays = totalWorkingDays - (absentHalf * 0.5) - absentFull;
      const percentage = totalWorkingDays > 0 ? Number(((presentDays / totalWorkingDays) * 100).toFixed(1)) : 100;

      return { 
        id: student._id, name: student.name, rollno: student.rollno, phno: student.father?.mobile, mail: student.mail, 
        percentage, classesAttended: presentDays, totalClasses: totalWorkingDays, status: percentage < 75 ? "Critical" : "Safe" 
      };
    });

    const totalPercentage = analytics.reduce((sum, s) => sum + s.percentage, 0);
    const classAverage = analytics.length > 0 ? (totalPercentage / analytics.length).toFixed(1) : 0;
    const defaulters = analytics.filter(s => s.percentage < 75);

    res.json({ success: true, stats: { totalStudents: analytics.length, classAverage, defaulterCount: defaulters.length }, students: analytics.sort((a, b) => a.rollno.localeCompare(b.rollno)), defaulters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassAttendanceReport = async (req, res) => {
  try {
    const { grade, section } = req.query;
    if (!grade || !section) return res.status(400).json({ success: false, message: "Params required" });

    const cleanGrade = grade.replace(/class/i, '').trim();
    const classId = `${cleanGrade}-${section.trim()}`;
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;

    const students = await Student.find({ grade: cleanGrade, section: section.trim() }).select("name rollno rollNumber").lean();
    
    const allRecords = await Attendance.find({
      classId,
      date: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
      }
    }).lean();

    const report = students.map(student => {
      const studentId = student._id.toString();

      const calcStats = (recordsArray) => {
          const absencesByDate = {};
          const uniqueDays = new Set();
          
          recordsArray.forEach(r => {
              const dStr = new Date(r.date).toISOString().split('T')[0];
              uniqueDays.add(dStr);
              if (r.absentees && r.absentees.map(a => a.toString()).includes(studentId)) {
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
          const percentage = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 100;

          return { 
            workingDays: totalWorkingDays, 
            presentDays, 
            absentHalf, 
            absentFull, 
            percentage: Number(percentage.toFixed(1)) 
          };
      };

      const monthlyRecords = allRecords.filter(r => new Date(r.date).getUTCMonth() + 1 === currentMonthNum);

      return {
        id: student._id,
        name: student.name,
        rollno: student.rollno || student.rollNumber || '--',
        monthly: calcStats(monthlyRecords),
        yearly: calcStats(allRecords)
      };
    }).sort((a, b) => String(a.rollno).localeCompare(String(b.rollno), undefined, { numeric: true }));

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const notifyDefaultersEmail = async (req, res) => {
  try {
    const { subject, defaulters } = req.body;
    const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });

    const emailPromises = defaulters.map(student => {
      const parentEmail = student.mail;
      if (!parentEmail) return Promise.resolve(); 
      const mailOptions = {
        from: `"Saints High School" <${process.env.EMAIL_USER}>`, to: parentEmail, subject: `⚠️ URGENT: Attendance Warning for ${student.name}`,
        html: `<div style="font-family: Arial; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;"><div style="background-color: #f43f5e; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;"><h2 style="color: white; margin: 0;">Attendance Alert</h2></div><div style="padding: 20px;"><p>Dear Parent,</p><p><strong>${student.name}</strong> has a critical attendance record for <strong>${subject}</strong>.</p><div style="background-color: #fff1f2; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;"><h1 style="color: #e11d48; margin: 0;">${student.percentage}%</h1></div><p>A minimum of 75% is required. Please contact the class teacher immediately.</p></div></div>`
      };
      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    res.status(200).json({ success: true, message: `Alerts sent to ${defaulters.length} parents.` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send emails." });
  }
};

// 🚨 FIXED: The getTeacherProfile now dynamically computes the attendance for the current year
export const getTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.userId;
    const teacher = await Teacher.findById(teacherId).select("-password").lean();
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    const currentYear = new Date().getFullYear();

    const allRecords = await TeacherAttendance.find({
      teacherId: teacherId,
      date: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
      }
    }).lean();

    const absencesByDate = {};
    const uniqueDays = new Set();

    allRecords.forEach(r => {
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

    const totalDays = uniqueDays.size;
    const presentDays = totalDays - (absentHalf * 0.5) - absentFull;
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

    // Inject exact calculated variables that the frontend expects
    teacher.attendanceSummary = {
        totalDays: totalDays,
        presentDays: presentDays,
        percentage: Number(percentage.toFixed(1))
    };

    res.status(200).json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.userId; 
    const { name, phno, mail, designation } = req.body;
    const updates = {};
    
    if (name) updates.name = name.trim();
    if (phno) updates.phno = phno.trim();
    if (designation) updates.designation = designation.trim();

    if (mail) {
      const cleanMail = mail.trim().toLowerCase();
      const exists = await Teacher.findOne({ mail: cleanMail, _id: { $ne: teacherId } }).lean();
      if (exists) return res.status(400).json({ success: false, message: "Email already in use by another account." });
      updates.mail = cleanMail;
    }

    if (req.file) {
      updates.image = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "saints_teachers", resource_type: "image" }, (error, result) => { 
          if (error) reject(error); else resolve(result.secure_url); 
        });
        stream.end(req.file.buffer);
      });
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(teacherId, { $set: updates }, { new: true }).select("-password").lean();
    res.json({ success: true, message: "Profile updated successfully", teacher: updatedTeacher });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const uploadResults = async (req, res) => {
  try {
    const { examId, maxMarks, results } = req.body;
    if (!examId || !maxMarks || !results || !Array.isArray(results)) {
      return res.status(400).json({ success: false, message: "Invalid payload format" });
    }

    await Exam.findByIdAndUpdate(examId, { maxMarks });

    const bulkOps = results.map((r) => ({
      updateOne: {
        filter: { examId, studentId: r.studentId },
        update: { $set: { teacherId: req.userId, marksObtained: r.marksObtained, remarks: r.remarks || "" } },
        upsert: true
      }
    }));

    await ExamResult.bulkWrite(bulkOps);
    res.status(200).json({ success: true, message: "Results saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStudentResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { marksObtained, remarks } = req.body;
    
    const result = await ExamResult.findOneAndUpdate({ _id: resultId, teacherId: req.userId }, { marksObtained, remarks }, { new: true }).lean();
    if (!result) return res.status(404).json({ success: false, message: "Result not found or unauthorized access" });
    res.status(200).json({ success: true, message: "Result updated successfully", result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStudentResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await ExamResult.findOneAndDelete({ _id: resultId, teacherId: req.userId });
    if (!result) return res.status(404).json({ success: false, message: "Result not found or unauthorized access" });
    res.status(200).json({ success: true, message: "Result deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamsForTeacher = async (req, res) => {
  try {
    const { grade, section } = req.query;

    let scheduleQuery = { "weeklySchedule.periods.teacherId": req.userId };
    if (grade) scheduleQuery.grade = grade;
    if (section) scheduleQuery.section = section;
    
    const schedules = await Schedule.find(scheduleQuery).lean();
    let taughtSubjects = new Set();
    let taughtClasses = new Set();

    schedules.forEach(schedule => {
      schedule.weeklySchedule.forEach(day => {
        day.periods.forEach(period => {
          if (period.teacherId && period.teacherId.toString() === req.userId.toString() && period.subject) {
            taughtSubjects.add(period.subject.toLowerCase().trim());
            taughtClasses.add(`${schedule.grade.replace(/class/i, '').trim()}-${schedule.section}`);
          }
        });
      });
    });

    if (taughtSubjects.size === 0) {
      return res.status(200).json({ success: true, exams: [] });
    }

    let examQuery = {};
    if (grade) examQuery.grade = { $in: [grade, `Class ${grade}`] };
    if (section) examQuery.section = { $in: [section, 'All'] };

    const allExams = await Exam.find(examQuery).sort({ examDate: -1 }).lean();

    const filteredExams = allExams.filter(exam => {
       const examSubj = exam.subject.toLowerCase().trim();
       const cleanExamGrade = exam.grade.replace(/class/i, '').trim();
       const examClassKey = `${cleanExamGrade}-${exam.section}`;
       const examClassKeyAll = `${cleanExamGrade}-All`;
       
       return taughtSubjects.has(examSubj) && (
         taughtClasses.has(examClassKey) || taughtClasses.has(examClassKeyAll) || Array.from(taughtClasses).some(tc => tc.startsWith(`${cleanExamGrade}-`))
       );
    });

    res.status(200).json({ success: true, exams: filteredExams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadStudyMaterial = async (req, res) => {
  try {
    const { title, description, grade, section, subject, link } = req.body;
    let fileUrl = "";
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "saints_study_materials", resource_type: "auto" }, (error, result) => { 
          if (error) reject(error); else resolve(result); 
        });
        stream.end(req.file.buffer);
      });
      fileUrl = result.secure_url;
    }
    const material = await StudyMaterial.create({ title, description, grade, section, subject, fileUrl, link, uploadedBy: req.userId });
    res.status(201).json({ success: true, message: "Material uploaded", material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResultsByExam = async (req, res) => {
  try {
    const results = await ExamResult.find({ examId: req.params.examId, teacherId: req.userId }).lean();
    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudyMaterialsForTeacher = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ uploadedBy: req.userId }).sort({createdAt: -1}).lean();
    res.status(200).json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStudyMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    if (material.uploadedBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this file" });
    }

    if (material.fileUrl) {
      const urlParts = material.fileUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `saints_study_materials/${filename.split('.')[0]}`; 
      const isDocument = material.fileUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i);
      await cloudinary.uploader.destroy(publicId, { resource_type: isDocument ? 'raw' : 'image' });
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Material and file deleted completely" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during deletion" });
  }
};

export const createClassNotice = async (req, res) => {
  try {
    const { title, content, targetGrade, targetSection } = req.body;
    if (!title || !content || !targetGrade || !targetSection) return res.status(400).json({ success: false, message: "Missing required fields" });
    const notice = await Notice.create({
        title, content, type: "Class", targetGrade, targetSection,
        createdBy: { userId: req.userId, role: "Teacher", name: req.teacher.name }
    });
    res.status(201).json({ success: true, message: "Notice created", notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ "createdBy.userId": req.userId }).sort({createdAt:-1}).lean();
    res.status(200).json({ success: true, notices });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherSchedule = async (req, res) => {
  try {
    const allSchedules = await Schedule.find({ "weeklySchedule.periods.teacherId": req.userId }).lean();
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedSchedule = daysOfWeek.map(day => ({ day, periods: [] }));

    allSchedules.forEach(classSchedule => {
      classSchedule.weeklySchedule.forEach(dayData => {
        const dayIndex = formattedSchedule.findIndex(d => d.day === dayData.dayOfWeek);
        if (dayIndex !== -1) {
          dayData.periods.forEach(period => {
            if (period.teacherId && period.teacherId.toString() === req.userId.toString()) {
              formattedSchedule[dayIndex].periods.push({
                periodNumber: period.periodNumber, subject: period.subject, grade: classSchedule.grade, 
                section: classSchedule.section, startTime: period.startTime, endTime: period.endTime, room: period.room || 'TBD'
              });
            }
          });
        }
      });
    });

    formattedSchedule.forEach(day => day.periods.sort((a, b) => a.periodNumber - b.periodNumber));
    res.status(200).json({ success: true, weeklySchedule: formattedSchedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentsByClass = async (req, res) => {
  try {
    const { grade, section } = req.query;
    if (!grade || !section) return res.status(400).json({ success: false, message: "Grade and Section required." });

    const students = await Student.find({ grade, section }).select("name rollno adno").sort({ rollno: 1 }).lean();
    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching students" });
  }
};

export const getTeacherDashboard = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.userId).select("name").lean();
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    const allSchedules = await Schedule.find({ "weeklySchedule.periods.teacherId": req.userId }).lean();
    let todayClasses = [];

    allSchedules.forEach(schedule => {
      schedule.weeklySchedule.forEach(dayNode => {
        if (dayNode.dayOfWeek === todayName) {
          dayNode.periods.forEach(period => {
            if (period.teacherId && period.teacherId.toString() === req.userId.toString()) {
              todayClasses.push({
                id: period._id, time: `${period.startTime} - ${period.endTime}`, startTime: period.startTime, 
                endTime: period.endTime, class: `Class ${schedule.grade} - Sec ${schedule.section}`,
                subject: period.subject, periodNumber: period.periodNumber
              });
            }
          });
        }
      });
    });

    todayClasses.sort((a, b) => a.periodNumber - b.periodNumber);

    const currentYear = new Date().getFullYear().toString();
    const assignedClassCount = await ClassTeacherAssignment.countDocuments({ 
        teacherId: req.userId, 
        academicYear: currentYear 
    });

    const recentNotices = await Notice.find({}).sort({ createdAt: -1 }).limit(4).lean();
    const formattedNotices = recentNotices.map(n => ({
      id: n._id, title: n.title, date: new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), type: n.type || 'General'
    }));

    res.json({
      success: true,
      data: { 
          teacherName: teacher.name, 
          stats: { 
              classesToday: todayClasses.length, 
              classesAssigned: assignedClassCount, 
              pendingTasks: 0 
          },
          todaySchedule: todayClasses, 
          recentNotices: formattedNotices 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error loading dashboard." });
  }
};

export const getReceivedAdminNotices = async (req, res) => {
  try {
    const adminNotices = await Notice.find({ $or: [{ type: 'Global' }, { "createdBy.role": "Admin" }] }).lean();
    const adminReports = await Report.find({ sentTo: { $in: ['All', 'Teacher'] } }).lean();

    const combinedFeed = [
      ...adminNotices.map(n => ({ _id: n._id, title: n.title, content: n.content, type: n.type || 'Global Notice', sentTo: 'All', createdAt: n.createdAt, generatedBy: n.createdBy || { name: 'Admin' } })),
      ...adminReports.map(r => ({ _id: r._id, title: r.title, content: "Official document attached.", type: r.type || 'Document', sentTo: r.sentTo, createdAt: r.createdAt, file: r.file, generatedBy: r.generatedBy || { name: 'Admin' } }))
    ];

    combinedFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ success: true, reports: combinedFeed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getScheduleByDay = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    
    const assignments = await ClassTeacherAssignment.find({ teacherId: req.userId, academicYear: currentYear }).lean();
    const allSchedules = await Schedule.find({ "weeklySchedule.periods.teacherId": req.userId }).lean();
    
    let daySchedules = [];
    const addedClasses = new Set();

    allSchedules.forEach(classSchedule => {
      classSchedule.weeklySchedule.forEach(dayData => {
        if (dayData.dayOfWeek === req.query.day) {
          dayData.periods.forEach(period => {
            if (period.teacherId && period.teacherId.toString() === req.userId.toString()) {
              const cleanScheduleGrade = classSchedule.grade.replace(/class/i, '').trim();
              
              const isClassTeacher = assignments.some(assignment => {
                 const cleanAssignmentGrade = assignment.grade.replace(/class/i, '').trim();
                 return cleanScheduleGrade === cleanAssignmentGrade && classSchedule.section.trim() === assignment.section.trim();
              });

              const uniqueKey = `${cleanScheduleGrade}-${classSchedule.section.trim()}`;
              addedClasses.add(uniqueKey);

              daySchedules.push({
                _id: period._id, periodNumber: period.periodNumber, subject: period.subject, grade: classSchedule.grade, section: classSchedule.section,
                startTime: period.startTime, endTime: period.endTime, room: period.room || 'TBA',
                isClassTeacher: !!isClassTeacher
              });
            }
          });
        }
      });
    });

    assignments.forEach((assignment, index) => {
      const cleanAssignmentGrade = assignment.grade.replace(/class/i, '').trim();
      const uniqueKey = `${cleanAssignmentGrade}-${assignment.section.trim()}`;
      
      if (!addedClasses.has(uniqueKey)) {
        daySchedules.push({
          _id: `ct-assignment-${index}`,
          periodNumber: 0, 
          subject: 'Class Teacher Duty',
          grade: assignment.grade,
          section: assignment.section,
          startTime: '00:00',
          endTime: '23:59',
          room: 'TBA',
          isClassTeacher: true
        });
        addedClasses.add(uniqueKey);
      }
    });

    daySchedules.sort((a, b) => a.periodNumber - b.periodNumber);
    
    res.status(200).json({ 
      success: true, 
      schedules: daySchedules, 
      assignedClassTeachers: assignments.map(a => ({ grade: a.grade, section: a.section })) 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceRecord = async (req, res) => {
  try {
    const d = new Date(req.query.date);
    d.setUTCHours(0, 0, 0, 0);
    
    const query = { classId: req.query.classId, date: d };
    if (req.query.session) {
      query.session = req.query.session;
    }
    
    const record = await Attendance.findOne(query).lean();
    res.status(200).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyAttendanceStats = async (req, res) => {
  try {
    const teacherId = req.userId;
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYearNum = new Date().getFullYear();

    const allRecords = await TeacherAttendance.find({
      teacherId: teacherId,
      date: {
        $gte: new Date(`${currentYearNum}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYearNum}-12-31T23:59:59.999Z`)
      }
    }).lean();

    const calcStats = (recordsArray) => {
      const absencesByDate = {};
      const uniqueDays = new Set();

      recordsArray.forEach(r => {
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
          if (count === 2) absentFull++;
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
      stats: { 
        monthly: calcStats(monthlyRecords), 
        yearly: calcStats(allRecords) 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const teacher = await Teacher.findById(req.userId);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    const isMatch = await bcrypt.compare(currentPassword, teacher.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect current password" });

    teacher.password = newPassword; 
    await teacher.save();
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during password update" });
  }
};

export const sendAttendanceAlerts = async (req, res) => {
  try {
    const { grade, section, date, session } = req.body;
    
    const cleanGrade = grade.replace(/class/i, '').trim();
    const cleanSection = section.trim();
    const classId = `${cleanGrade}-${cleanSection}`;

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ classId, date: d, session }).lean();
    if (!record || !record.absentees || record.absentees.length === 0) {
      return res.status(400).json({ success: false, message: "No absent students found for this session." });
    }

    const absentStudents = await Student.find({ _id: { $in: record.absentees } }).select("name rollno father mother").lean();

    const alerts = absentStudents.map(student => {
      let parentPhone = student.father?.mobile || student.mother?.mobile || "";
      if (parentPhone) {
        parentPhone = parentPhone.replace(/\D/g, '');
        if (parentPhone.length === 10) parentPhone = `91${parentPhone}`;
      }

      const sessionName = session === 'FN' ? 'Forenoon' : 'Afternoon';
      const message = `Dear Parent, your ward ${student.name} (Roll No: ${student.rollno}) is marked ABSENT for today's ${sessionName} session.\n– St. Ann's High School`;

      return { phone: parentPhone, message };
    }).filter(a => a.phone);

    for (const alert of alerts) {
      const encodedMessage = encodeURIComponent(alert.message);
      const url = `whatsapp://send?phone=${alert.phone}&text=${encodedMessage}`;

      await execPromise(`start "" "${url}"`);

      await execPromise(`powershell -command "$wshell = New-Object -ComObject wscript.shell; Start-Sleep -Seconds 6; $wshell.SendKeys('~')"`);

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    res.status(200).json({ success: true, message: `Automated WhatsApp alerts successfully dispatched to ${alerts.length} parents via native desktop integration.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignedClasses = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const assignments = await ClassTeacherAssignment.find({ teacherId: req.userId, academicYear: currentYear }).lean();
    res.status(200).json({ success: true, classes: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassExamTerms = async (req, res) => {
  try {
    const { grade, section } = req.query;
    const cleanGrade = grade.replace(/class/i, '').trim();
    const cleanSection = section.trim();
    
    const terms = await Exam.distinct("examTerm", { 
        grade: { $in: [grade, cleanGrade, `Class ${cleanGrade}`] }, 
        section: { $in: [cleanSection, 'All'] } 
    });
    res.status(200).json({ success: true, terms: terms.filter(t => t != null) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassResultMatrix = async (req, res) => {
  try {
    const { grade, section, examTerm } = req.query;
    const cleanGrade = grade.replace(/class/i, '').trim();
    const cleanSection = section.trim();
    
    const currentYear = new Date().getFullYear().toString();
    const assignment = await ClassTeacherAssignment.findOne({ 
        grade: { $in: [grade, cleanGrade, `Class ${cleanGrade}`] }, 
        section: cleanSection, 
        teacherId: req.userId, 
        academicYear: currentYear 
    });
    if (!assignment) return res.status(403).json({ success: false, message: "Unauthorized: You are not assigned as the Class Teacher for this class." });

    const students = await Student.find({ grade: cleanGrade, section: cleanSection }).select('name rollno adno').sort({ rollno: 1 }).lean();
    const exams = await Exam.find({ examTerm, grade: { $in: [grade, cleanGrade, `Class ${cleanGrade}`] }, section: { $in: [cleanSection, 'All'] } }).lean();
    const examIds = exams.map(e => e._id);
    const results = await ExamResult.find({ examId: { $in: examIds } }).populate('examId').lean();

    const subjects = exams.map(e => ({ id: e._id, name: e.subject, maxMarks: e.maxMarks || 100 }));

    const matrix = students.map(student => {
       let totalObtained = 0;
       let totalMax = 0;
       const subjectMarks = {};

       subjects.forEach(sub => {
           const r = results.find(res => res.studentId.toString() === student._id.toString() && res.examId._id.toString() === sub.id.toString());
           if (r) {
               subjectMarks[sub.name] = r.marksObtained;
               totalObtained += r.marksObtained;
               totalMax += sub.maxMarks;
           } else {
               subjectMarks[sub.name] = "-";
           }
       });

       return {
           ...student,
           subjectMarks,
           totalObtained,
           totalMax,
           percentage: totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0
       };
    });

    const subjectStats = {};
    subjects.forEach(sub => {
        const marks = results.filter(r => r.examId._id.toString() === sub.id.toString()).map(r => r.marksObtained);
        if (marks.length > 0) {
            subjectStats[sub.name] = {
                highest: Math.max(...marks),
                lowest: Math.min(...marks),
                average: (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1)
            };
        } else {
            subjectStats[sub.name] = { highest: '-', lowest: '-', average: '-' };
        }
    });

    const overallClassPercentage = matrix.length > 0 
        ? (matrix.reduce((a, b) => a + parseFloat(b.percentage), 0) / matrix.length).toFixed(1) 
        : 0;

    res.status(200).json({ success: true, matrix, subjects, subjectStats, overallClassPercentage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentResultsByLookup = async (req, res) => {
  try {
    const { grade, section, identifier } = req.query; 
    const cleanGrade = grade.replace(/class/i, '').trim();
    const cleanSection = section.trim();
    const cleanIdentifier = identifier.trim();
    
    const currentYear = new Date().getFullYear().toString();
    const assignment = await ClassTeacherAssignment.findOne({ 
        grade: { $in: [grade, cleanGrade, `Class ${cleanGrade}`] }, 
        section: cleanSection, 
        teacherId: req.userId, 
        academicYear: currentYear 
    });
    if (!assignment) return res.status(403).json({ success: false, message: "Unauthorized: You are not assigned as the Class Teacher for this class." });

    const student = await Student.findOne({ 
        grade: cleanGrade, 
        section: cleanSection, 
        $or: [
            { rollno: new RegExp(`^${cleanIdentifier}$`, 'i') }, 
            { adno: new RegExp(`^${cleanIdentifier}$`, 'i') }
        ] 
    }).select('-password').lean();

    if (!student) return res.status(404).json({ success: false, message: "Student not found in this class." });

    const results = await ExamResult.find({ studentId: student._id })
        .populate('examId', 'examTerm title subject examDate maxMarks')
        .lean();

    const groupedHistory = {};
    results.forEach(r => {
        const term = r.examId?.examTerm || 'Uncategorized Examination';
        if (!groupedHistory[term]) {
            groupedHistory[term] = { results: [], totalObtained: 0, totalMax: 0 };
        }
        groupedHistory[term].results.push(r);
        groupedHistory[term].totalObtained += r.marksObtained;
        groupedHistory[term].totalMax += (r.examId?.maxMarks || 100);
    });

    res.status(200).json({ success: true, student, history: groupedHistory });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};