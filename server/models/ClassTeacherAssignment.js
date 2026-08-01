import mongoose from "mongoose";

const classTeacherAssignmentSchema = new mongoose.Schema({
  grade: { type: String, required: true },
  section: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true }, 
  academicYear: { type: String, required: true }
});

// Ensures the exact same Class and Section can't be assigned twice in the same year
classTeacherAssignmentSchema.index({ grade: 1, section: 1, academicYear: 1 }, { unique: true });

const ClassTeacherAssignment = mongoose.models.ClassTeacherAssignment || mongoose.model("ClassTeacherAssignment", classTeacherAssignmentSchema);

// 🚨 AUTOMATIC FIX: This commands MongoDB to forcefully destroy the stuck unique index
// so you don't have to manually delete it in MongoDB Compass.
ClassTeacherAssignment.collection.dropIndex('teacherId_1').catch(err => {
    // If the index is already dropped, it will safely ignore the error and continue
});

export default ClassTeacherAssignment;