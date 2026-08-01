import express from 'express';
import Log from '../models/Log.js'; 
import { adminAuth } from '../middlewares/authAdmin.js'; 

const logRouter = express.Router();

/* ============================
   GET ALL LOGS
============================ */
logRouter.get('/all', adminAuth, async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ success: false, message: "Server error fetching logs" });
  }
});

/* ============================
   CLEAR ALL LOGS (BULK DELETE)
============================ */
logRouter.delete('/clear-all', adminAuth, async (req, res) => {
  try {
    await Log.deleteMany({});
    res.status(200).json({ success: true, message: "All audit logs purged successfully" });
  } catch (error) {
    console.error("Error clearing logs:", error);
    res.status(500).json({ success: false, message: "Server error clearing logs" });
  }
});

/* ============================
   DELETE SINGLE LOG
============================ */
logRouter.delete('/:id', adminAuth, async (req, res) => {
  try {
    const log = await Log.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: "Log entry not found" });
    }
    res.status(200).json({ success: true, message: "Log entry deleted" });
  } catch (error) {
    console.error("Error deleting log:", error);
    res.status(500).json({ success: false, message: "Server error deleting log" });
  }
});

export default logRouter;