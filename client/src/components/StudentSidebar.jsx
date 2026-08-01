import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, FiCalendar, FiBookOpen, 
  FiAward, FiBell, FiSettings,
  FiCheckSquare, FiCreditCard, FiFolder, FiFileText
} from 'react-icons/fi';
import schoolLogo from '../assets/St_logo.jpeg'; 

const StudentSidebar = ({ closeMobileMenu }) => {
  const navGroups = [
    {
      title: "Main",
      items: [
        { name: 'Dashboard', path: '/student/dashboard', icon: <FiHome size={20} /> },
      ]
    },
    {
      title: "Academics",
      items: [
        { name: 'My Timetable', path: '/student/my-schedule', icon: <FiCalendar size={20} /> },
        { name: 'My Attendance', path: '/student/attendance', icon: <FiCheckSquare size={20} /> },
        { name: 'Study Materials', path: '/student/materials', icon: <FiBookOpen size={20} /> },
      ]
    },
    {
      title: "Examinations",
      items: [
        { name: 'Exam Schedule', path: '/student/exam-schedule', icon: <FiFileText size={20} /> },
        { name: 'My Results', path: '/student/results', icon: <FiAward size={20} /> },
        { name: 'Admin Reports', path: '/student/reports', icon: <FiFolder size={20} /> },
      ]
    },
    {
      title: "General",
      items: [
        { name: 'Fee Portal', path: '/student/fees', icon: <FiCreditCard size={20} /> },
        { name: 'Notice Board', path: '/student/notices', icon: <FiBell size={20} /> },
        { name: 'Settings', path: '/student/settings', icon: <FiSettings size={20} /> },
      ]
    }
  ];

  return (
    <div className="w-full lg:w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl relative">
      
      {/* Brand Header */}
      <div className="flex items-center h-28 border-b border-slate-800 shrink-0 px-5">
        <div className="flex flex-row items-center gap-3 w-full">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden shrink-0 border border-slate-700">
            <img src={schoolLogo} alt="St. Ann's Crest" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-[13px] font-serif font-bold text-white leading-tight break-words">St. Ann's High School</span>
            <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold mt-1">Student Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar relative z-10">
        
        {navGroups.map((group, index) => (
          <div key={index} className="space-y-1">
            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{group.title}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'}`}>
                      {item.icon}
                    </div>
                    <span className={isActive ? 'font-bold' : ''}>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Mini-Profile */}
      <div className="p-4 relative z-10 border-t border-slate-800">
        <NavLink 
          to="/student/profile"
          onClick={closeMobileMenu}
          className="bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:shadow-md rounded-2xl p-4 flex items-center gap-3 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <span className="font-bold text-sm">ST</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300">My Profile</p>
            <p className="text-xs text-slate-400 truncate">View Details</p>
          </div>
        </NavLink>
      </div>

    </div>
  );
};

export default StudentSidebar;