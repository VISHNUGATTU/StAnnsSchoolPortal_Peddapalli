import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiMenu, FiX, FiLogOut, FiUser, FiChevronDown,
  FiCalendar, FiPieChart, FiCheckSquare, FiFolder, 
  FiSettings, FiBell, FiEdit3, FiUsers
} from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import TeacherSidebar from './TeacherSidebar';

const TeacherLayout = () => {
  const { logout, user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getHeaderInfo = (path) => {
    if (path === '/teacher/dashboard') return { title: `${getGreeting()}, `, highlight: user?.name?.split(' ')[0] || 'Faculty', suffix: ' ☀️', subtitle: 'Here is what your day looks like.' };
    if (path.includes('/teacher/my-schedule')) return { title: 'My Master Schedule', subtitle: 'View your daily classes, timings, and assigned sections.', icon: <FiCalendar className="text-indigo-600" /> };
    
    // 🚨 ADDED Mapping for My Class
    if (path.includes('/teacher/my-class')) return { title: 'My Class', subtitle: 'Manage results and lookup details for the classes you are assigned to.', icon: <FiUsers className="text-teal-600" /> };
    
    if (path.includes('/teacher/my-attendance')) return { title: 'My Attendance Record', subtitle: 'View your cumulative attendance statistics for the current academic year.', icon: <FiPieChart className="text-indigo-600" /> };
    if (path.includes('/teacher/mark-attendance')) return { title: 'Daily Session Attendance', subtitle: 'Select your designated class to mark Forenoon or Afternoon attendance.', icon: <FiCheckSquare className="text-indigo-600" /> };
    if (path.includes('/teacher/exam-schedule')) return { title: 'Master Exam Schedule', subtitle: 'View upcoming examinations and deadlines across all classes.', icon: <FiCalendar className="text-teal-600" /> };
    if (path.includes('/teacher/marks-upload')) return { title: 'Upload Marks', subtitle: 'Enter and submit student examination scores.', icon: <FiEdit3 className="text-indigo-600" /> }; 
    if (path.includes('/teacher/reports')) return { title: 'Study Materials & Reports', subtitle: 'Upload assignment briefs for students or download official admin reports.', icon: <FiFolder className="text-indigo-600" /> };
    if (path.includes('/teacher/notices')) return { title: 'Notice Board', subtitle: 'Publish announcements to your classes and view official updates from the administration.', icon: <FiBell className="text-amber-500" /> };
    if (path.includes('/teacher/settings')) return { title: 'Account Settings', subtitle: 'Manage your security, preferences, and account access.', icon: <FiSettings className="text-slate-600" /> };
    if (path.includes('/teacher/profile')) return { title: 'My Profile', subtitle: 'Manage your faculty account details.' };
    return { title: 'Faculty Portal', subtitle: 'St. Ann\'s High School' };
  };

  const headerInfo = getHeaderInfo(location.pathname);
  const isUploadMarks = location.pathname.includes('/teacher/marks-upload');

  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden font-sans">
      
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-20">
         <TeacherSidebar isOpen={false} toggleSidebar={() => {}} />
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={toggleSidebar}
        ></div>
      )}

      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 lg:hidden shadow-2xl bg-slate-900 w-64`}>
         <TeacherSidebar isOpen={true} toggleSidebar={toggleSidebar} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative lg:ml-64 w-full">
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-30 sticky top-0">
          <div className="flex items-center gap-3">
             <button 
               onClick={toggleSidebar} 
               className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
             >
               {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
             </button>
             <div className="flex flex-col text-left">
                 <span className="text-[14px] font-serif font-bold text-slate-800 leading-tight">St. Ann's High School</span>
                 <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold mt-0.5">Faculty Portal</span>
             </div>
          </div>

          <div className="relative">
             <button onClick={() => setProfileOpen(!profileOpen)} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
               {user?.name?.charAt(0).toUpperCase() || 'T'}
             </button>
             {profileOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fade-in z-50">
                 <Link to="/teacher/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600">
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
          
          <div className="animate-fade-in">
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

          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 p-2 pl-4 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800 leading-tight">{user?.name || 'Faculty'}</span>
                <span className="text-xs font-medium text-slate-400">Teacher Account</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <FiChevronDown className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fade-in z-50">
                <Link to="/teacher/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
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

        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isUploadMarks ? 'p-0 md:p-0 lg:p-0' : 'p-4 md:p-6 lg:p-8'} scroll-smooth custom-scrollbar relative z-0`}>
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/40 to-transparent -z-10 pointer-events-none"></div>
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default TeacherLayout;