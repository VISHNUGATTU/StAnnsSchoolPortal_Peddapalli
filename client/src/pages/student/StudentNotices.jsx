import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBell, FiInfo, FiClock, FiCalendar, FiTarget
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentNotices = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All', 'Global', 'Class'

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/notices`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          setNotices(data.notices);
        }
      } catch (error) {
        toast.error("Failed to load notice board.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [backendUrl]);

  const filteredNotices = notices.filter(notice => {
    if (filter === 'All') return true;
    return notice.type === filter;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      {/* Filter Tabs & Info Banner merged conceptually */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 w-full md:w-auto overflow-x-auto">
          {['All', 'Global', 'Class'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === tab 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 md:p-5 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <FiInfo size={20} />
        </div>
        <div>
          <h4 className="text-indigo-900 font-bold text-sm mb-1">Official Communications</h4>
          <p className="text-indigo-700/80 font-medium text-xs md:text-sm leading-relaxed">
            Notices labeled <span className="font-bold text-amber-600">GLOBAL</span> apply to all students in the school. Notices labeled <span className="font-bold text-indigo-600">CLASS</span> are specific to your enrolled grade and section.
          </p>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-6 animate-slide-up">
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FiBell size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Announcements</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto">
              There are currently no active notices for your selected category. Check back later!
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isGlobal = notice.type === 'Global';

            return (
              <div 
                key={notice._id} 
                className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group relative overflow-hidden"
              >
                {/* Decorative Background Accent */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isGlobal ? 'bg-amber-400' : 'bg-indigo-500'}`}></div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md flex items-center gap-1.5 border ${
                        isGlobal 
                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {isGlobal ? <FiTarget /> : <FiInfo />} {notice.type} Notice
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <FiCalendar /> {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                      {notice.title}
                    </h2>
                  </div>
                </div>

                {/* 🚨 THE FIX: Safely render description only if it exists */}
                <div className="prose prose-slate max-w-none text-slate-600 font-medium text-sm md:text-base leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  {notice.description ? (
                    notice.description.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
                    ))
                  ) : (
                    <p className="text-slate-400 italic mb-0">No additional details provided.</p>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FiClock /> Posted at {new Date(notice.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default StudentNotices;