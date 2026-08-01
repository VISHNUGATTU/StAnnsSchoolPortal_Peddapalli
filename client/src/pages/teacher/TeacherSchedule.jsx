import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCalendar, FiClock, FiMapPin, FiUsers, FiInfo 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherSchedule = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');

  // Determine today's day to set the default active tab
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].includes(today)) {
      setActiveDay(today);
    }
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/teacher/schedule`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          // The backend returns { weeklySchedule: [{day, periods}, ...] } for teacher
          // So we re-map it to look like the Student format { Monday: [...], Tuesday: [...] }
          const formattedSchedule = {};
          data.weeklySchedule.forEach(dayNode => {
             formattedSchedule[dayNode.day] = dayNode.periods;
          });
          setSchedule(formattedSchedule);
        }
      } catch (error) {
        toast.error("Failed to load your timetable.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading your timetable...</p>
      </div>
    );
  }

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const activePeriods = schedule ? schedule[activeDay] || [] : [];

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      {/* Days Navigation Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 pb-2">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ${
              activeDay === day 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transform scale-[1.02]' 
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
        
        {/* Day Header Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800">{activeDay}'s Schedule</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {activePeriods.length} Classes Scheduled
            </p>
          </div>
        </div>

        {activePeriods.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FiCalendar size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Classes Today</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto">
              There are no classes scheduled for {activeDay}. Enjoy your free time or utilize it for offline tasks.
            </p>
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-4">
            {activePeriods.map((period, index) => (
              <div 
                key={period._id || index} 
                className="flex flex-col md:flex-row bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md rounded-2xl p-5 gap-6 transition-all group"
              >
                {/* Time & Period Badge */}
                <div className="md:w-48 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start shrink-0 md:border-r border-slate-100 pr-6">
                  <div>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md mb-2 inline-block">
                      Period {period.periodNumber}
                    </span>
                    <h3 className="text-lg font-black text-slate-800">{period.startTime}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                      <FiClock size={14} /> to {period.endTime}
                    </p>
                  </div>
                </div>

                {/* Subject Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {period.subject}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <FiMapPin className="text-slate-400" /> Room {period.room || 'TBA'}
                    </span>
                    {period.subject.toLowerCase().includes('lab') && (
                      <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">
                        <FiInfo size={14} /> Practical Session
                      </span>
                    )}
                  </div>
                </div>

                {/* Class Assignment Details */}
                <div className="md:w-64 flex items-center gap-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-500 border border-white shadow-sm flex items-center justify-center shrink-0">
                    <FiUsers size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Designated Class</p>
                    <p className="font-bold text-slate-800 truncate">Class {period.grade}</p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Section {period.section}</p>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default TeacherSchedule;