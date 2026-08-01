import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiClock, FiCalendar, FiBell, FiChevronRight, 
  FiCheckCircle, FiAlertCircle, FiBookOpen, FiCreditCard,FiCheckSquare
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentHome = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/dashboard`, {
          withCredentials: true
        });
        
        if (data.success) {
          setDashboardData(data.data);
        }
      } catch (error) {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { profile, todaySchedule, recentNotices, currentDay } = dashboardData;
  const attendancePercentage = profile.attendance?.percentage || 100;
  const feeDue = profile.feeDetails?.dueAmount || 0;

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans pb-12 mt-4">
      
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Attendance Stat */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => navigate('/student/attendance')}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Current Attendance</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-slate-800 leading-none">{attendancePercentage.toFixed(1)}%</h3>
            </div>
            <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${attendancePercentage >= 75 ? 'text-teal-500' : 'text-rose-500'}`}>
              {attendancePercentage >= 75 ? <><FiCheckCircle /> Excellent</> : <><FiAlertCircle /> Needs Attention</>}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${attendancePercentage >= 75 ? 'border-teal-100 bg-teal-50 text-teal-500' : 'border-rose-100 bg-rose-50 text-rose-500'}`}>
            <FiCheckSquare size={24} />
          </div>
        </div>

        {/* Fees Stat */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => navigate('/student/fees')}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Pending Fees</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-slate-800 leading-none">₹{feeDue.toLocaleString()}</h3>
            </div>
            <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${feeDue > 0 ? 'text-rose-500' : 'text-teal-500'}`}>
              {feeDue > 0 ? <><FiAlertCircle /> Payment Pending</> : <><FiCheckCircle /> All Cleared</>}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${feeDue > 0 ? 'border-rose-100 bg-rose-50 text-rose-500' : 'border-teal-100 bg-teal-50 text-teal-500'}`}>
            <FiCreditCard size={24} />
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-600/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <p className="text-indigo-200 text-xs font-black uppercase tracking-wider mb-1">Quick Link</p>
            <h3 className="text-white text-xl font-bold leading-tight">View Study<br/>Materials</h3>
          </div>
          <button onClick={() => navigate('/student/materials')} className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold w-fit flex items-center gap-2 transition-colors border border-white/10">
            <FiBookOpen /> Open Library
          </button>
        </div>

      </div>

      {/* Main Grid: Timetable & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Today's Timetable */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><FiClock /></span>
              Today's Classes ({currentDay})
            </h3>
            <button onClick={() => navigate('/student/my-schedule')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Full Week <FiChevronRight />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {todaySchedule.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                  <FiCalendar size={24} />
                </div>
                <h4 className="font-bold text-slate-600">No Classes Today</h4>
                <p className="text-sm text-slate-400 font-medium mt-1">Enjoy your free time or review your study materials.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todaySchedule.map((period, index) => (
                  <div key={period._id || index} className="p-5 flex items-center gap-5 hover:bg-slate-50 transition-colors">
                    <div className="w-16 text-right shrink-0">
                      <p className="text-sm font-black text-slate-800">{period.time.split(' - ')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400">{period.time.split(' - ')[1]}</p>
                    </div>
                    <div className="w-1 h-12 bg-indigo-100 rounded-full shrink-0 relative">
                      <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{period.subject}</h4>
                      <p className="text-sm font-medium text-slate-500 mt-0.5">By {period.teacherName} • Room {period.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notice Board */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><FiBell /></span>
              Notice Board
            </h3>
            <button onClick={() => navigate('/student/notices')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-1 relative overflow-hidden shadow-lg shadow-slate-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            {recentNotices.length === 0 ? (
              <div className="p-8 text-center relative z-10">
                <FiBell size={24} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-400">No new notices.</p>
              </div>
            ) : (
              <div className="space-y-1 relative z-10">
                {recentNotices.map((notice) => (
                  <div key={notice._id} className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-700">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${notice.type === 'Global' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {notice.type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {new Date(notice.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-sm leading-tight mb-1">{notice.title}</h4>
                    <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">{notice.description}</p>
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

export default StudentHome;