import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiClock, FiUsers, FiBookOpen, FiBell, 
  FiChevronRight, FiCalendar, FiCheckSquare, FiEdit3, FiAlertCircle
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherHome = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  // Dynamic State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    teacherName: "Faculty",
    stats: { classesToday: 0, classesAssigned: 0, pendingTasks: 0 },
    todaySchedule: [],
    recentNotices: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/teacher/dashboard`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          setDashboardData(data.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError("Unable to connect to the server. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendUrl]);

  // Helper to figure out if a class is active right now based on strings like "09:00 AM"
  const getScheduleStatus = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return 'upcoming';
    
    try {
      const now = new Date();
      
      const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM' || modifier === 'pm') hours = parseInt(hours, 10) + 12;
        
        const d = new Date();
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return d;
      };

      const start = parseTime(startTimeStr);
      const end = parseTime(endTimeStr);

      if (now > end) return 'completed';
      if (now >= start && now <= end) return 'current';
      return 'upcoming';
    } catch (e) {
      return 'upcoming'; // Fallback if time format is strange
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-rose-50 rounded-3xl border border-rose-200 mt-10 max-w-lg mx-auto">
        <FiAlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
        <h3 className="text-rose-800 font-bold text-lg mb-1">Dashboard Error</h3>
        <p className="text-rose-600 font-medium text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold">Refresh Page</button>
      </div>
    );
  }

  const { stats, todaySchedule, recentNotices } = dashboardData;

  const statCards = [
    { title: "Classes Today", value: stats.classesToday, icon: <FiBookOpen />, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Assigned Sections", value: stats.classesAssigned, icon: <FiUsers />, color: "text-teal-600", bg: "bg-teal-100" },
    { title: "Pending Tasks", value: stats.pendingTasks, icon: <FiCheckSquare />, color: "text-amber-600", bg: "bg-amber-100" }
  ];

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* 🚨 UPDATED: Replaced the large header block with a sleek date and quick attendance bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-500 font-bold tracking-wider uppercase text-xs">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/teacher/mark-attendance')}
          className="relative z-10 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <FiCheckSquare /> Quick Attendance
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Schedule */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FiClock className="text-indigo-500" /> Today's Classes
              </h2>
              <button 
                onClick={() => navigate('/teacher/my-schedule')}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                Full Schedule <FiChevronRight />
              </button>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FiClock size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-navy">No classes scheduled for today.</p>
                <p className="text-sm text-slate-400 font-medium">Enjoy your free time or manage offline tasks.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedule.map((cls) => {
                  const status = getScheduleStatus(cls.startTime, cls.endTime);
                  return (
                    <div 
                      key={cls.id} 
                      className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl border transition-all ${
                        status === 'current' 
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100' 
                          : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0">
                        <div className={`w-2 h-12 rounded-full ${
                          status === 'completed' ? 'bg-teal-400' : 
                          status === 'current' ? 'bg-indigo-500' : 'bg-slate-300'
                        }`}></div>
                        <div>
                          <p className={`text-sm font-bold ${status === 'current' ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {cls.time}
                          </p>
                          <h4 className="text-lg font-black text-slate-800">{cls.class}</h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 ml-6 md:ml-0">
                        <div className="text-left md:text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</p>
                          <p className="font-bold text-slate-700">{cls.subject}</p>
                        </div>
                        
                        {status === 'current' && (
                          <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg animate-pulse">
                            Ongoing
                          </span>
                        )}
                        {status === 'completed' && (
                          <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-lg">
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notices & Quick Links */}
        <div className="space-y-8">
          
          {/* Quick Actions Widget */}
          <div className="bg-slate-900 rounded-3xl shadow-xl p-6 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-white font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <button 
                onClick={() => navigate('/teacher/marks-upload')}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors backdrop-blur-sm"
              >
                <FiEdit3 size={24} className="text-indigo-300" />
                <span className="text-xs font-bold tracking-wide">Upload Marks</span>
              </button>
              <button 
                onClick={() => navigate('/teacher/exam-schedule')}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors backdrop-blur-sm"
              >
                <FiCalendar size={24} className="text-teal-300" />
                <span className="text-xs font-bold tracking-wide">Exam Dates</span>
              </button>
            </div>
          </div>

          {/* Notices Widget */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FiBell className="text-amber-500" /> Notice Board
              </h2>
              <button 
                onClick={() => navigate('/teacher/notices')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiChevronRight size={20} />
              </button>
            </div>

            {recentNotices.length === 0 ? (
              <p className="text-sm font-medium text-slate-400 text-center py-4">No recent notices.</p>
            ) : (
              <div className="space-y-4">
                {recentNotices.map((notice) => (
                  <div key={notice.id} className="group cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0"></div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {notice.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {notice.date}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] font-bold text-indigo-500">
                            {notice.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherHome;