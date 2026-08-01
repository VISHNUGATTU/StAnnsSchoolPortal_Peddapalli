import express from 'express';
import { 
  createReport, 
  getAdminReports, 
  getTeacherReports,
  getSystemReports,
  deleteReportById,
  deleteAdminReports,
  deleteTeacherReports,
  getReports
} from '../controllers/reportController.js';

import { upload } from "../configs/multer.js";
import { adminAuth } from "../middlewares/authAdmin.js";

const reportRouter = express.Router();

// ==========================================
// 📤 UPLOAD REPORTS
// ==========================================
reportRouter.post('/create', adminAuth, upload.single('file'), createReport);

reportRouter.get('/all', adminAuth, getReports);
reportRouter.delete('/:id', adminAuth, deleteReportById);

// Role-specific fetching
reportRouter.get('/admin', adminAuth, getAdminReports);
reportRouter.get('/teacher', adminAuth, getTeacherReports);
reportRouter.get('/system', adminAuth, getSystemReports);

// ==========================================
// 🗑️ DELETE REPORTS
// ==========================================
reportRouter.delete('/admin', adminAuth, deleteAdminReports);
reportRouter.delete('/teacher', adminAuth, deleteTeacherReports); 
reportRouter.delete('/:id', adminAuth, deleteReportById);

export default reportRouter;