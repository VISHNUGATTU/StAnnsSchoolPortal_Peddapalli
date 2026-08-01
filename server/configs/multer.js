import multer from "multer";

// You MUST use memoryStorage for Cloudinary streams to work
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for profile pictures
});