import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from './context/AppContext';

// ---------------- Authentication ----------------
import Login from './components/Login';
import StudentLayout from './components/StudentLayout';

// ---------------- Admin Pages ----------------
import AdminLayout from './components/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherMangement from './pages/admin/TeacherMangement';
import ScheduleMangement from './pages/admin/ScheduleMangement';
import ExamScheduleManagement from './pages/admin/ExamScheduleManagement';
import BatchPromotion from './pages/admin/BatchPromotion';
import AdminReports from './pages/admin/AdminReports';
import AdminNotices from './pages/admin/AdminNotices';
import AdminLogs from './pages/admin/AdminLogs';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSettings from './pages/admin/AdminSettings';
import FeeStructure from './pages/admin/FeeStructure';
import FeePayment from './pages/admin/FeePayment';
import AdminTeacherAttendance from './pages/admin/AdminTeacherAttendance';

import AddStudent from './pages/admin/AddStudent';
import UpdateStudent from './pages/admin/UpdateStudent';
import DeleteStudent from './pages/admin/DeleteStudent';
import SearchStudent from './pages/admin/SearchStudent';

import AddTeacher from './pages/admin/AddTeacher';
import UpdateTeacher from './pages/admin/UpdateTeacher';
import DeleteTeacher from './pages/admin/DeleteTeacher';
import SearchTeacher from './pages/admin/SearchTeacher';

import ClassTeacherAssignment from './pages/admin/ClassTeacherAssignment';
import SalaryManagement from './pages/admin/SalaryManagement';

// ---------------- Teacher Pages ----------------
import TeacherLayout from './components/TeacherLayout';
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import MarkStudentAttendance from './pages/teacher/MarkStudentAttendance';
import TeacherExamSchedule from './pages/teacher/TeacherExamSchedule';
import UploadMarks from './pages/teacher/UploadMarks';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherEditProfile from './pages/teacher/TeacherEditProfile';
import TeacherSettings from './pages/teacher/TeacherSettings';
import TeacherNotices from './pages/teacher/TeacherNotices';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
// 🚨 NEW MODULE
import MyClassResults from './pages/teacher/MyClassResults';

// ---------------- Student Pages ----------------
import StudentHome from './pages/student/StudentHome';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentExamSchedule from './pages/student/StudentExamSchedule';
import StudentReports from './pages/student/StudentReports';
import StudentProfile from './pages/student/StudentProfile';
import StudentEditProfile from './pages/student/StudentEditProfile';
import StudentSettings from './pages/student/StudentSettings';
import StudentStudyMaterials from './pages/student/StudentStudyMaterials';
import StudentResults from './pages/student/StudentResults';
import StudentNotices from './pages/student/StudentNotices';
import StudentFees from './pages/student/StudentFees';

// ================= INLINE ROUTE PROTECTOR =================
const RequireAuth = ({ allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-school-background">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (role === "TEACHER") return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Outlet />;
};

const App = () => {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontWeight: '500',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} 
      />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* ================= ADMIN DOMAIN ================= */}
        <Route element={<RequireAuth allowedRoles={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminHome />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/teachers" element={<TeacherMangement />} />
            
            <Route path="/admin/class-teachers" element={<ClassTeacherAssignment />} />
            <Route path="/admin/salaries" element={<SalaryManagement />} /> 
            
            <Route path="/admin/schedule" element={<ScheduleMangement />} />
            <Route path="/admin/exams" element={<ExamScheduleManagement />} />
            <Route path="/admin/promote" element={<BatchPromotion />} />
            <Route path="/admin/fees/structure" element={<FeeStructure />} />
            <Route path="/admin/fees/collect" element={<FeePayment />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/notices" element={<AdminNotices />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/teacher-attendance" element={<AdminTeacherAttendance />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/add-student" element={<AddStudent />} />
            <Route path="/admin/update-student" element={<UpdateStudent />} />
            <Route path="/admin/delete-student" element={<DeleteStudent />} />
            <Route path="/admin/search-student" element={<SearchStudent />} />
            <Route path="/admin/add-teacher" element={<AddTeacher />} />
            <Route path="/admin/update-teacher" element={<UpdateTeacher />} />
            <Route path="/admin/delete-teacher" element={<DeleteTeacher />} />
            <Route path="/admin/search-teacher" element={<SearchTeacher />} />
          </Route>
        </Route>

        {/* ================= TEACHER DOMAIN ================= */}
        <Route element={<RequireAuth allowedRoles={["TEACHER"]} />}>
          <Route element={<TeacherLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherHome />} />
            <Route path="/teacher/my-schedule" element={<TeacherSchedule />} />
            
            {/* 🚨 NEW ROUTE */}
            <Route path="/teacher/my-class" element={<MyClassResults />} />

            <Route path="/teacher/mark-attendance" element={<MarkStudentAttendance />} />
            <Route path="/teacher/exam-schedule" element={<TeacherExamSchedule />} />
            <Route path="/teacher/marks-upload" element={<UploadMarks />} />
            <Route path="/teacher/reports" element={<TeacherReports />} />
            <Route path="/teacher/notices" element={<TeacherNotices />} />
            <Route path="/teacher/profile" element={<TeacherProfile />} />
            <Route path="/teacher/profile/edit" element={<TeacherEditProfile />} />
            <Route path="/teacher/settings" element={<TeacherSettings />} />
            <Route path="/teacher/my-attendance" element={<TeacherAttendance />} />
          </Route>
        </Route>

        {/* ================= STUDENT DOMAIN ================= */}
        <Route element={<RequireAuth allowedRoles={["STUDENT"]} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentHome />} />
          <Route path="/student/my-schedule" element={<StudentSchedule />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/exam-schedule" element={<StudentExamSchedule />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/materials" element={<StudentStudyMaterials />} />
          <Route path="/student/reports" element={<StudentReports />} />
          <Route path="/student/fees" element={<StudentFees />} />
          <Route path="/student/notices" element={<StudentNotices />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/profile/edit" element={<StudentEditProfile />} />
          <Route path="/student/settings" element={<StudentSettings />} />
        </Route>
      </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;