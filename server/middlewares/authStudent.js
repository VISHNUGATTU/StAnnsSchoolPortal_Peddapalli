import jwt from "jsonwebtoken";
import Student from "../models/Student.js"; 

export const studentAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies; 

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. Please login." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role.toUpperCase() !== "STUDENT") {
      return res.status(403).json({ success: false, message: "Access Denied: Students only" });
    }

    const student = await Student.findById(decoded.id).select("-password").lean();
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student account not found" });
    }

    req.userId = student._id.toString(); 
    req.student = student; 

    if (req.path === "/is-auth" || req.path.endsWith("/is-auth")) {
      return res.json({ success: true, student });
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
    return res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
};