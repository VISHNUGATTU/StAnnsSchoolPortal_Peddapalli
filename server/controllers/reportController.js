import Report from '../models/Report.js'; // 🏫 Assumes Report model matches our earlier schema
import { v2 as cloudinary } from 'cloudinary';

// Helper: Upload Buffer to Cloudinary
const uploadStream = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        resource_type: 'auto',       
        folder: 'saints_reports',          
        use_filename: true,
        unique_filename: true,    
      }, 
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};

export const createReport = async (req, res) => {
  try {
    const { title, type, fileUrl, sentTo, targetGrade, targetSection } = req.body;
    let fileData = {};

    const allowedMimeTypes = [
      'application/pdf',                                                        
      'application/msword',                                                     
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',                                               
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      
      'image/jpeg',                                                             
      'image/png'                                                               
    ];

    if (req.file) {
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid file type. Only PDF, Word, Excel, JPG, and PNG are allowed." 
        });
      }

      const result = await uploadStream(req.file);
      
      fileData = {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        size: result.bytes
      };
    } 
    else if (fileUrl) {
      fileData = { url: fileUrl, fileName: 'External Link', fileType: 'link', size: 0 };
    } 
    else {
      return res.status(400).json({ success: false, message: "File or URL is required." });
    }

    const currentUserId = req.admin?._id || req.teacher?._id;
    const userRole = req.admin ? 'Admin' : req.teacher ? 'Teacher' : 'System';
    const userName = req.admin?.name || req.teacher?.name || 'Auto';

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID missing."});
    }

    // 🚨 THE FIX: Convert "All" into 'null' so Mongoose doesn't trigger an Enum error
    let finalGrade = targetGrade === 'All' ? null : (targetGrade || null);
    let finalSection = targetSection === 'All' ? null : (targetSection || null);

    // If grade is null (meaning All Classes), forcefully nullify the section too
    if (!finalGrade) {
      finalSection = null;
    }

    const newReport = await Report.create({
      title,
      type,
      file: fileData,
      sentTo: sentTo || 'All', 
      targetGrade: finalGrade,     
      targetSection: finalSection, 
      generatedBy: { 
        userId: currentUserId, 
        role: userRole, 
        name: userName 
      },
      status: 'Completed'
    });

    res.status(201).json({ success: true, message: "Report uploaded successfully", data: newReport });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   GET REPORTS (Inbox vs Sent)
============================ */
export const getReports = async (req, res) => {
  try {
    const { tab } = req.query;
    
    // ✅ CRITICAL FIX: Extract current ID based on auth type
    const currentUserId = req.admin?._id || req.teacher?._id || req.student?._id;
    const currentUserRole = req.admin ? 'Admin' : req.teacher ? 'Teacher' : req.student ? 'Student' : '';
    
    let query = {};

    if (tab === 'sent') {
      query = { 'generatedBy.userId': currentUserId };
    } else {
      query = {
        'generatedBy.userId': { $ne: currentUserId }, 
        $or: [
          { sentTo: 'All' },
          { sentTo: currentUserRole }, 
          { sentTo: currentUserId } 
        ]
      };

      if (currentUserRole === 'Student' && req.student) {
        query.$or.push({ 
          sentTo: 'Student', 
          targetGrade: req.student.grade, 
          targetSection: req.student.section 
        });
      }
    }

    const reports = await Report.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   DELETE REPORT BY ID
============================ */
export const deleteReportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ CRITICAL FIX: Extract current ID safely
    const currentUserId = req.admin?._id || req.teacher?._id;
    const isAdmin = !!req.admin;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    const reportOwnerId = report.generatedBy?.userId;

    const isOwner = reportOwnerId && reportOwnerId.toString() === currentUserId?.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: You can only delete your own reports." 
      });
    }

    if (report.file && report.file.publicId) {
      await cloudinary.uploader.destroy(report.file.publicId);
    }

    await Report.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ... Keep your other role-based fetching routes the same ... */

/* ============================
   ROLE-BASED FETCHING (Admin View)
============================ */
export const getAdminReports = async (req, res) => {
  try {
    const reports = await Report.find({ 'generatedBy.role': 'Admin' }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherReports = async (req, res) => {
  try {
    const reports = await Report.find({ 'generatedBy.role': 'Teacher' }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSystemReports = async (req, res) => {
  try {
    const reports = await Report.find({ 'generatedBy.role': 'System' }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   BULK DELETION (Admin Only)
============================ */
export const deleteAdminReports = async (req, res) => {
  try {
    const result = await Report.deleteMany({ 'generatedBy.role': 'Admin' });
    res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} Admin reports` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTeacherReports = async (req, res) => {
  try {
    const result = await Report.deleteMany({ 'generatedBy.role': 'Teacher' });
    res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} Teacher reports` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};