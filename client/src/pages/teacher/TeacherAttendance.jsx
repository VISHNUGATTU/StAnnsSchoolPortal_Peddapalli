import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCalendar, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiTrendingUp, FiCoffee
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherAttendance = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('monthly'); 
  
  const [stats, setStats] = useState({
    monthly: { totalWorkingDays: 0, presentDays: 0, absentHalf: 0, absentFull: 0, percentage: 100 },
    yearly: { totalWorkingDays: 0, presentDays: 0, absentHalf: 0, absentFull: 0, percentage: 100 }
  });

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/teacher/attendance/my-stats`, { 
          withCredentials: true 
        });
        
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        toast.error("Failed to load attendance records.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading attendance data...</p>
      </div>
    );
  }

  const currentData = viewMode === 'monthly' ? stats.monthly : stats.yearly;

  // 🚨 FIXED: Fallback to prevent NaN/Undefined rendering issues when Working Days is 0
  const validWorkingDays = currentData?.totalWorkingDays || 0;
  const validPresentDays = currentData?.presentDays || 0;
  const validAbsentHalf = currentData?.absentHalf || 0;
  const validAbsentFull = currentData?.absentFull || 0;
  
  // Safe math evaluation for visual rings
  const calcPercentage = validWorkingDays > 0 
    ? ((validPresentDays / validWorkingDays) * 100).toFixed(1) 
    : 100;

  const isSafe = calcPercentage >= 75;
  const statusColor = isSafe ? 'text-teal-500' : 'text-rose-500';
  const statusBg = isSafe ? 'bg-teal-50 border-teal-100' : 'bg-rose-50 border-rose-100';

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-fade-in font-sans relative pb-10 mt-4">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy">My Attendance</h1>
          <p className="text-sm font-medium text-slate-500">Track your session-wise presence.</p>
        </div>
        
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button 
            onClick={() => setViewMode('monthly')} 
            className={`px-5 py-2 text-xs font-bold transition-colors ${viewMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setViewMode('cumulative')} 
            className={`px-5 py-2 text-xs font-bold transition-colors border-l border-slate-200 ${viewMode === 'cumulative' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Cumulative
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/40 text-center h-full flex flex-col items-center justify-center relative overflow-hidden">
            
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${isSafe ? 'bg-teal-500' : 'bg-rose-500'}`}></div>

            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 z-10">
              {viewMode} Percentage
            </h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center z-10 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={statusColor}
                  strokeDasharray={`${calcPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800">{calcPercentage}%</span>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${statusBg} ${statusColor} z-10`}>
              {isSafe ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
              {isSafe ? 'Status: Safe' : 'Status: Critical Warning'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-1 bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-slate-900/20 flex flex-col justify-between">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <FiCalendar className="text-indigo-400 mb-4" size={24} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Working Days</p>
                <h3 className="text-3xl text-white font-black">{validWorkingDays}</h3>
              </div>
            </div>

            <div className="col-span-1 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center mb-3">
                <FiTrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Present</p>
                <h3 className="text-3xl font-black text-slate-800">{validPresentDays}</h3>
              </div>
            </div>

            <div className="col-span-1 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                <FiXCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Leaves</p>
                <h3 className="text-3xl font-black text-slate-800">{validAbsentFull}</h3>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                <FiCoffee size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Half Leaves</p>
                <h3 className="text-3xl font-black text-slate-800">{validAbsentHalf}</h3>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <FiAlertCircle />
            </div>
            <div>
              <h4 className="text-indigo-900 font-bold text-lg mb-1">Calculation Metrics</h4>
              <p className="text-indigo-700/80 font-medium text-sm leading-relaxed">
                Your attendance is tracked session-wise (Forenoon and Afternoon). Two half-day absences mathematically equate to one full-day deduction. Your Loss of Pay calculations in the payroll module directly utilize this data. Contact Admin for record adjustments.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeacherAttendance;