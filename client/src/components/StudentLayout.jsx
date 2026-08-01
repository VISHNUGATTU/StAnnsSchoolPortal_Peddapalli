import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiMenu, FiX, FiLogOut, FiUser, FiChevronDown,
  FiCalendar, FiCheckSquare, FiBookOpen, FiAward, 
  FiFolder, FiCreditCard, FiBell, FiSettings, FiFileText, FiEdit
} from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import StudentSidebar from './StudentSidebar';

const StudentLayout = () => {
  const { logout, user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 🚨 NEW: Dynamic Header Mapping matching original student inner pages exactly with icons
  const getHeaderInfo = (path) => {
    if (path === '/student/dashboard') return { title: 'Welcome back, ', highlight: user?.name?.split(' ')[0] || 'Student', suffix: '!', subtitle: 'Your academic overview.', icon: null };
    if (path.includes('/student/my-schedule')) return { title: 'My Timetable', subtitle: 'View your weekly class schedule and assigned teachers.', icon: <FiCalendar className="text-indigo-600" /> };
    if (path.includes('/student/attendance')) return { title: 'My Attendance', subtitle: 'Track your presence across sessions.', icon: <FiCheckSquare className="text-indigo-600" /> };
    if (path.includes('/student/materials')) return { title: 'Study Materials', subtitle: 'Access notes, assignments, and resources uploaded by your teachers.', icon: <FiBookOpen className="text-indigo-600" /> };
    if (path.includes('/student/exam-schedule')) return { title: 'Exam Schedule', subtitle: 'View your upcoming assessments, mid-terms, and final examinations.', icon: <FiFileText className="text-indigo-600" /> };
    if (path.includes('/student/results')) return { title: 'Academic Results', subtitle: 'Review your performance across all recorded examinations.', icon: <FiAward className="text-indigo-600" /> };
    if (path.includes('/student/reports')) return { title: 'Admin Reports', subtitle: 'View and download official documents, certificates, and administration reports.', icon: <FiFolder className="text-indigo-600" /> };
    if (path.includes('/student/fees')) return { title: 'Fee Portal', subtitle: 'View your academic fee structure, outstanding dues, and payment history.', icon: <FiCreditCard className="text-indigo-600" /> };
    if (path.includes('/student/notices')) return { title: 'Notice Board', subtitle: 'Stay updated with official school announcements and class updates.', icon: <FiBell className="text-indigo-600" /> };
    if (path.includes('/student/settings')) return { title: 'Account Settings', subtitle: 'Manage your security preferences and portal configurations.', icon: <FiSettings className="text-indigo-600" /> };
    if (path.includes('/student/profile/edit')) return { title: 'Update Profile', subtitle: 'Modify your contact and residential details.', icon: <FiEdit className="text-indigo-600" /> };
    if (path.includes('/student/profile')) return { title: 'My Profile', subtitle: 'View your academic and personal information recorded in the system.', icon: <FiUser className="text-indigo-600" /> };
    return { title: 'Student Portal', subtitle: 'St. Ann\'s High School', icon: null };
  };

  const headerInfo = getHeaderInfo(location.pathname);
  const isDashboard = location.pathname === '/student/dashboard';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-20">
        <StudentSidebar />
      </div>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <div className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 lg:hidden shadow-2xl bg-slate-900 w-64`}>
        <StudentSidebar closeMobileMenu={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative lg:ml-64 w-full">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
               {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
             </button>
             <div className="flex flex-col text-left">
                 <span className="text-[14px] font-serif font-bold text-slate-800 leading-tight">St. Ann's High School</span>
                 <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold mt-0.5">Student Portal</span>
             </div>
          </div>

          <div className="relative">
             <button onClick={() => setProfileOpen(!profileOpen)} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
               {user?.name?.charAt(0).toUpperCase() || 'S'}
             </button>
             {profileOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fade-in z-50">
                 <Link to="/student/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600">
                   <FiUser size={16} /> My Profile
                 </Link>
                 <div className="h-px bg-slate-100 my-1"></div>
                 <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50">
                   <FiLogOut size={16} /> Sign Out
                 </button>
               </div>
             )}
           </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0 z-30">
          
          {/* 🚨 UPDATED: Renders dynamic title, icon, and subtitle matching student pages */}
          <div className="animate-fade-in flex items-center gap-4">
            {isDashboard && (
               <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl border border-indigo-100">
                 {user?.name?.charAt(0).toUpperCase() || 'S'}
               </div>
            )}
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                {headerInfo.icon}
                <span>
                  {headerInfo.title}
                  {headerInfo.highlight && <span className="text-indigo-600">{headerInfo.highlight}</span>}
                  {headerInfo.suffix}
                </span>
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">{headerInfo.subtitle}</p>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 p-2 pl-4 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800 leading-tight">{user?.name || 'Student'}</span>
                <span className="text-xs font-medium text-slate-400">Class {user?.grade}-{user?.section}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <FiChevronDown className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fade-in z-50">
                <Link to="/student/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                  <FiUser size={16} /> My Profile
                </Link>
                <div className="h-px bg-slate-100 my-1"></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors">
                  <FiLogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white to-transparent pointer-events-none -z-10"></div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative z-0">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default StudentLayout;