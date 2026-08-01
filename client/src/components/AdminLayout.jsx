import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiUser, FiChevronDown, FiMenu, FiX } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { logout, user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 🚨 NEW: Dynamic Header Mapping for Admin
  const getHeaderInfo = (path) => {
    if (path === '/admin/dashboard') return { title: 'Welcome back, ADMIN', subtitle: 'System Overview & Analytics', highlight: 'ADMIN' };
    if (path.includes('/admin/students')) return { title: 'Student Directory', subtitle: 'Manage all enrolled students across sections.' };
    if (path.includes('/admin/teachers')) return { title: 'Faculty Management', subtitle: 'View and manage all registered teachers.' };
    if (path.includes('/admin/class-teachers')) return { title: 'Class Teachers', subtitle: 'Assign and manage class teachers.' };
    if (path.includes('/admin/teacher-attendance')) return { title: 'Faculty Attendance', subtitle: 'Monitor daily attendance records for staff.' };
    if (path.includes('/admin/schedule')) return { title: 'Master Schedule', subtitle: 'Manage academic timetables.' };
    if (path.includes('/admin/exams')) return { title: 'Examinations', subtitle: 'Manage exam schedules and results.' };
    if (path.includes('/admin/fees/structure')) return { title: 'Fee Structure', subtitle: 'Configure academic fee parameters.' };
    if (path.includes('/admin/fees/collect')) return { title: 'Fee Collection', subtitle: 'Process and monitor student fee payments.' };
    if (path.includes('/admin/promote')) return { title: 'Academic Promotion', subtitle: 'Promote students to the next academic year.' };
    if (path.includes('/admin/notices')) return { title: 'Notice Board', subtitle: 'Broadcast announcements and circulars.' };
    if (path.includes('/admin/reports')) return { title: 'System Reports', subtitle: 'Generate and export administrative data.' };
    if (path.includes('/admin/logs')) return { title: 'System Logs', subtitle: 'Monitor application activity and security.' };
    if (path.includes('/admin/settings')) return { title: 'Settings', subtitle: 'Configure core application parameters.' };
    if (path.includes('/admin/profile')) return { title: 'My Profile', subtitle: 'Manage your administrator account.' };
    return { title: 'Admin Portal', subtitle: 'St. Ann\'s High School' };
  };

  const headerInfo = getHeaderInfo(location.pathname);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-20">
        <AdminSidebar />
      </div>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <div className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 lg:hidden shadow-2xl bg-slate-900 w-64`}>
        <AdminSidebar closeMobileMenu={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative lg:ml-64 w-full">
        
        {/* Mobile Top Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
               {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
             </button>
             <div className="flex flex-col text-left">
                <span className="text-[14px] font-serif font-bold text-slate-800 leading-tight">St. Ann's High School</span>
                <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold mt-0.5">Admin Portal</span>
             </div>
           </div>
          
           <div className="relative">
             <button onClick={() => setProfileOpen(!profileOpen)} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
               {user?.name?.charAt(0).toUpperCase() || 'A'}
             </button>
             {profileOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fade-in z-50">
                 <Link to="/admin/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600">
                   <FiUser size={16} /> Edit Profile
                 </Link>
                 <div className="h-px bg-slate-100 my-1"></div>
                 <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50">
                   <FiLogOut size={16} /> Secure Logout
                 </button>
               </div>
             )}
           </div>
        </div>

        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0 z-30">
          
          {/* 🚨 UPDATED: Renders dynamic title for every page */}
          <div className="animate-fade-in">
            <h1 className="text-2xl font-serif font-bold text-slate-800">
              {headerInfo.title.replace('ADMIN', '')} 
              {headerInfo.highlight && <span className="text-amber-500">{headerInfo.highlight}</span>}
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{headerInfo.subtitle}</p>
          </div>

          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 p-2 pl-4 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800 leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {user?.mail || 'admin@stanns.edu'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <FiChevronDown className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fade-in z-50">
                <Link 
                  to="/admin/profile" 
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <FiUser size={16} /> Edit Profile
                </Link>
                <div className="h-px bg-slate-100 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <FiLogOut size={16} /> Secure Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;