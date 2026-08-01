import Log from "../models/Log.js";

/* ============================
   GET SYSTEM LOGS (Admin Only)
============================ */
export const getSystemLogs = async (req, res) => {
  try {
    const { role, limit = 50 } = req.query;
    
    let query = {};
    if (role) {
      query['actor.role'] = role; // e.g., Filter by 'Teacher' or 'Student' actions
    }

    // ⚡ PERFORMANCE: .lean() is essential here as logs can be heavy
    const logs = await Log.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(Number(limit))    // Limit to latest 50 by default for speed
      .lean();

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error("Log Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};