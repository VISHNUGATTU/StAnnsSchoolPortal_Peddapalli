import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies; 

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. Please login." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role.toUpperCase() !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Access Denied: Admins only" });
    }

    const admin = await Admin.findById(decoded.id).select("-password").lean();
    
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    req.userId = admin._id.toString(); 
    req.admin = admin; 

    if (req.path === "/is-auth" || req.path.endsWith("/is-auth")) {
      return res.json({ success: true, admin });
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