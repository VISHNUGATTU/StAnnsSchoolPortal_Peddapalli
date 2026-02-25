import React, { useEffect, useState } from 'react';
import { CalendarIcon, User, AlertCircle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('/api/student/history', { withCredentials: true });
        if (data.success) setHistory(data.history);
      } catch (err) {
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 text-indigo-600 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="font-medium text-gray-500">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 min-h-screen bg-gray-50/50 font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-white hover:bg-gray-50 text-gray-600 rounded-xl shadow-sm border border-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Absence History</h1>
        </div>
        
        {history.length > 0 && (
          <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-lg text-sm font-semibold border border-rose-100">
            Total Absences: {history.length}
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 md:p-16 text-center border border-dashed border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
             <CheckCircle size={32} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Perfect Record!</h2>
          <p className="text-gray-500 mt-2 font-medium">You haven't missed a single class. Keep up the excellent work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div key={record.id} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 md:gap-6 hover:shadow-md transition-all group">
              
              {/* DATE BLOCK (Calendar tear-off style) */}
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl px-4 py-3 min-w-[76px] border border-gray-100 group-hover:bg-rose-50 group-hover:border-rose-100 transition-colors">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-rose-500">
                  {new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-2xl font-bold text-gray-900 mt-0.5 group-hover:text-rose-700">
                  {new Date(record.date).getDate()}
                </span>
              </div>

              {/* DETAILS */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{record.subject}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${record.type === 'Lab' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                    {record.type}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-gray-500 font-medium mt-2 md:mt-0">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <User size={15} className="text-gray-400"/> {record.faculty}
                  </span>
                  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CalendarIcon size={15} className="text-gray-400"/> {new Date(record.date).getFullYear()}
                  </span>
                </div>
              </div>

              {/* ABSENT TAG */}
              <div className="hidden sm:flex shrink-0">
                <span className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-100 uppercase tracking-wider">
                  Absent
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DISPUTE NOTICE */}
      {history.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200/60 flex gap-3.5 items-start">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-semibold">Dispute a Record?</span> If you were present but marked absent for any of the classes above, please contact the respective faculty member or the admin office within 4 to 6 hours of the class date.
          </p>
        </div>
      )}
      
    </div>
  );
};

export default AttendanceHistory;