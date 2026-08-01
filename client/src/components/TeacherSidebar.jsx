import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiHome, FiCalendar, FiCheckSquare, 
  FiEdit3, FiBell, FiUser, FiLogOut, FiX,
  FiFileText, FiFolder, FiSettings,FiPieChart, FiUsers
} from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import schoolLogo from '../assets/St_logo.jpeg'; 

const TeacherSidebar = ({ isOpen, toggleSidebar }) => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/teacher/logout`, {}, {
        withCredentials: true
      });
      if (data.success) {
        toast.success("Logged out successfully");
        navigate('/teacher-login');
      }
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: <FiHome size={20} /> },
    { name: 'My Schedule', path: '/teacher/my-schedule', icon: <FiCalendar size={20} /> },
    { name: 'My Attendance', path: '/teacher/my-attendance', icon: <FiPieChart size={20} /> },
    { name: 'Mark Attendance', path: '/teacher/mark-attendance', icon: <FiCheckSquare size={20} /> },
    { name: 'My Class', path: '/teacher/my-class', icon: <FiUsers size={20} /> },
    { name: 'Exam Schedule', path: '/teacher/exam-schedule', icon: <FiFileText size={20} /> },
    { name: 'Upload Marks', path: '/teacher/marks-upload', icon: <FiEdit3 size={20} /> },
    { name: 'Reports', path: '/teacher/reports', icon: <FiFolder size={20} /> },
    { name: 'Notice Board', path: '/teacher/notices', icon: <FiBell size={20} /> },
    { name: 'My Profile', path: '/teacher/profile', icon: <FiUser size={20} /> },
    { name: 'Settings', path: '/teacher/settings', icon: <FiSettings size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-2xl lg:shadow-none lg:static transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Header - Updated with St. Ann's Branding */}
        <div className="h-28 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex flex-row items-center gap-3 w-full">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden shrink-0 border border-slate-700">
              <img src={schoolLogo} alt="St. Ann's Crest" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[13px] font-serif font-bold text-white leading-tight break-words">St. Ann's High School</span>
              <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold mt-1">Faculty Portal</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-500 hover:text-rose-500 transition-colors shrink-0 ml-2">
            <FiX size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => { if(window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="text-sm">{item.name}</span>
            </NavLink>
          ))}
          
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
          >
            <FiLogOut size={20} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default TeacherSidebar;