import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js"; 

export const teacherAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role.toUpperCase() !== "TEACHER") { 
      return res.status(403).json({ success: false, message: "Access Denied: Teachers Only" });
    }

    const teacher = await Teacher.findById(decoded.id).select("-password").lean();
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher account not found" });
    }

    req.userId = teacher._id.toString(); 
    req.teacher = teacher; 

    if (req.path === "/is-auth" || req.path.endsWith("/is-auth")) {
      return res.json({ success: true, teacher });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
        res.clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", 
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",  
        });
    }
    return res.status(401).json({ success: false, message: "Session expired. Please login." });
  }
};