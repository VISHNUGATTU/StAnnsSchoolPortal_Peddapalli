import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Phone, Mail, Coffee, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Helper to determine if a class is currently active
  const isClassNow = (timeStr) => {
    if (!timeStr || !timeStr.includes('-')) return false;

    const [startStr, endStr] = timeStr.split('-').map(s => s.trim());
    
    const convertToMinutes = (str) => {
      const [time, modifier] = str.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
      return hours * 60 + minutes;
    };

    const now = new Date();
    // Only check "Live" if the active tab is today's actual day
    const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (activeDay !== currentDayName) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    try {
      const start = convertToMinutes(startStr);
      const end = convertToMinutes(endStr);
      return currentMinutes >= start && currentMinutes <= end;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data } = await axios.get('/api/student/full-schedule', { withCredentials: true });
        if (data.success) {
          setSchedule(data.schedule);
          if (activeDay === "Sunday") setActiveDay("Monday");
        }
      } catch (err) {
        toast.error("Failed to fetch detailed timetable");
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [activeDay]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 text-indigo-600 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="font-medium text-gray-500">Syncing your timetable...</p>
      </div>
    );
  }

  const currentDayClasses = schedule?.[activeDay] || [];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & DAY SELECTOR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Calendar className="text-indigo-600" size={28} /> Weekly Schedule
            </h1>
            <p className="mt-1.5 text-gray-500 font-medium">Detailed period-wise breakdown with faculty contacts.</p>
          </div>
          
          {/* Professional Segmented Control for Days */}
          <div className="flex bg-gray-200/60 p-1.5 rounded-xl overflow-x-auto border border-gray-200/50 shadow-inner w-full lg:w-auto custom-scrollbar-hide">
            {days.map(day => {
              const isActive = activeDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-1 lg:flex-none px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-white text-indigo-700 shadow-sm border border-gray-100' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA */}
        {currentDayClasses.length === 0 ? (
          <div className="bg-white rounded-3xl py-20 text-center border border-dashed border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
               <Coffee size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No Academic Sessions</h3>
            <p className="text-gray-500 mt-2 font-medium">You have a free day on {activeDay}. Take some time to rest!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDayClasses.map((cls, idx) => {
              const timeString = cls.time ? cls.time : `${cls.startTime} - ${cls.endTime}`;
              const isLive = isClassNow(timeString);

              return (
                <div 
                  key={idx} 
                  className={`relative bg-white rounded-2xl p-5 md:p-6 transition-all flex flex-col h-full group ${
                    isLive 
                      ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md bg-indigo-50/10' 
                      : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  
                  {/* Top Section: Time & Badges */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex items-center gap-2 font-semibold ${isLive ? 'text-indigo-700' : 'text-gray-600'}`}>
                      <Clock size={18} className={isLive ? "text-indigo-600" : "text-gray-400"} />
                      <span>{timeString}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {isLive && (
                        <span className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                          Live
                        </span>
                      )}
                      {cls.type === 'Lab' && (
                        <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-md border border-purple-100 uppercase tracking-wide">
                          Lab
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Subject & Location */}
                  <div className="flex-grow mb-6">
                    <h3 className={`text-xl font-bold leading-tight mb-2 line-clamp-2 ${isLive ? 'text-indigo-950' : 'text-gray-900'}`}>
                      {cls.subject}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                      <MapPin size={16} className="text-gray-400 shrink-0" />
                      <span className="truncate">Room: {cls.room}</span>
                    </div>
                  </div>

                  {/* Footer: Faculty Profile */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={cls.facultyImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(cls.facultyName || 'Faculty')}&background=f3f4f6&color=4b5563&font-size=0.33`} 
                        className="h-10 w-10 rounded-xl object-cover border border-gray-200 shrink-0"
                        alt={cls.facultyName}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{cls.facultyName || 'TBA'}</p>
                        <p className="text-xs text-gray-500 font-medium truncate">Instructor</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0 ml-2">
                      {cls.facultyPhone && (
                        <a 
                          href={`tel:${cls.facultyPhone}`} 
                          className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Call Instructor"
                        >
                          <Phone size={18} />
                        </a>
                      )}
                      {cls.facultyEmail && (
                        <a 
                          href={`mailto:${cls.facultyEmail}`} 
                          className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Email Instructor"
                        >
                          <Mail size={18} />
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Inline CSS to hide scrollbar on the day selector for cleaner look */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default StudentSchedule;