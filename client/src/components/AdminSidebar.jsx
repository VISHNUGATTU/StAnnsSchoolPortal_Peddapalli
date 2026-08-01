import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiBriefcase, FiCalendar, 
  FiFileText, FiTrendingUp, FiCreditCard, 
  FiPieChart, FiActivity, FiCheckSquare, 
  FiBell, FiSettings, FiUserCheck, FiDollarSign // 🚨 Added icon
} from 'react-icons/fi';
import schoolLogo from '../assets/St_logo.jpeg'; 

const AdminSidebar = ({ closeMobileMenu }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FiHome size={20} /> },
    { name: 'Students', path: '/admin/students', icon: <FiUsers size={20} /> },
    { name: 'Teachers', path: '/admin/teachers', icon: <FiBriefcase size={20} /> },
    { name: 'Class Teachers', path: '/admin/class-teachers', icon: <FiUserCheck size={20} /> },
    { name: 'Teacher Attendance', path: '/admin/teacher-attendance', icon: <FiCheckSquare size={20} /> },
    { name: 'Schedule', path: '/admin/schedule', icon: <FiCalendar size={20} /> },
    { name: 'Exams', path: '/admin/exams', icon: <FiFileText size={20} /> },
    { name: 'Fees Structure', path: '/admin/fees/structure', icon: <FiCreditCard size={20} /> },
    { name: 'Fees Collection', path: '/admin/fees/collect', icon: <FiCreditCard size={20} /> },
    { name: 'Salary Mgmt', path: '/admin/salaries', icon: <FiDollarSign size={20} /> }, // 🚨 NEW LINK INSERTED
    { name: 'Promote', path: '/admin/promote', icon: <FiTrendingUp size={20} /> },
    { name: 'Notices', path: '/admin/notices', icon: <FiBell size={20} /> },
    { name: 'Reports', path: '/admin/reports', icon: <FiPieChart size={20} /> },
    { name: 'System Logs', path: '/admin/logs', icon: <FiActivity size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <FiSettings size={20} /> },
  ];

  return (
    <div className="w-full h-screen bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl relative">
      
      <div className="flex items-center h-28 border-b border-slate-800 shrink-0 px-5">
        <div className="flex flex-row items-center gap-3 w-full">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden shrink-0 border border-slate-700">
            <img src={schoolLogo} alt="St. Ann's Crest" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-[13px] font-serif font-bold text-white leading-tight break-words">St. Ann's High School</span>
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mt-1">Admin Portal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide space-y-1.5">
        {navItems.map((item) => {
          const isStudentSubPage = item.name === 'Students' && ['/admin/add-student', '/admin/update-student', '/admin/delete-student', '/admin/search-student'].includes(location.pathname);
          const isTeacherSubPage = item.name === 'Teachers' && ['/admin/add-teacher', '/admin/update-teacher', '/admin/delete-teacher', '/admin/search-teacher'].includes(location.pathname);
          const isActive = location.pathname === item.path || isStudentSubPage || isTeacherSubPage;

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'}`}>
                {item.icon}
              </div>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AdminSidebar;