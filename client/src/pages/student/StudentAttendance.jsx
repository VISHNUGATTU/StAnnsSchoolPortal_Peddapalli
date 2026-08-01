import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCheckSquare, FiCheckCircle, FiXCircle, 
  FiPieChart, FiAlertCircle, FiTrendingUp, FiCalendar
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentAttendance = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    monthly: { workingDays: 0, presentDays: 0, absentHalf: 0, absentFull: 0, percentage: 100 },
    yearly: { workingDays: 0, presentDays: 0, absentHalf: 0, absentFull: 0, percentage: 100 }
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/attendance`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          if (data.summary) setSummary(data.summary);
          if (data.history) setHistory(data.history);
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
        <p className="text-slate-500 font-bold animate-pulse">Loading attendance records...</p>
      </div>
    );
  }

  const renderStatsRow = (periodData, title) => {
    // 🚨 FIXED: Maps to the correct dynamic keys returned by the new backend
    const totalWorkingDays = periodData?.totalWorkingDays || 0;
    const presentDays = periodData?.presentDays || 0;
    const absentHalf = periodData?.absentHalf || 0;
    const absentFull = periodData?.absentFull || 0;
    const percentage = periodData?.percentage || 100;
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-600 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-indigo-600/20">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <FiCalendar className="text-indigo-300 mb-4" size={24} />
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-1">Percentage</p>
            <h3 className="text-3xl font-black">{percentage}%</h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center mb-4">
              <FiCheckSquare size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Working Days</p>
              <h3 className="text-3xl font-black text-slate-800">{totalWorkingDays}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center mb-4">
              <FiTrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Present Days</p>
              <h3 className="text-3xl font-black text-slate-800">{presentDays}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
              <FiXCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Missed (Half / Full)</p>
              <h3 className="text-3xl font-black text-slate-800">{absentHalf} / {absentFull}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-fade-in font-sans relative pb-12 mt-4">

      <div className="space-y-8">
        
        {renderStatsRow(summary.monthly, "Current Month Attendance")}
        {renderStatsRow(summary.yearly, "Cumulative Academic Year Attendance")}

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Recent Activity
          </h3>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {history.length === 0 ? (
              <div className="p-10 text-center">
                <FiCheckSquare className="mx-auto text-slate-300 mb-3" size={32} />
                <h4 className="font-bold text-slate-600 text-lg">No Records Found</h4>
                <p className="text-slate-400 font-medium text-sm mt-1">Your attendance hasn't been marked yet.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-slate-100">
                  {history.map((record) => {
                    const isPresent = record.status === 'Present';
                    return (
                      <div key={record._id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPresent ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                            {isPresent ? <FiCheckCircle size={18} /> : <FiXCircle size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Session: {record.session || "FN"}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md border ${isPresent ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                          {record.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentAttendance;