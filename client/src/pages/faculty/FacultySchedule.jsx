import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, Plus, Clock, MapPin, 
  X, User, Trash2, Grid, AlertTriangle, Layers 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { useAppContext } from '../../context/AppContext'; 
import toast from 'react-hot-toast';

// --- HELPER FUNCTIONS ---
const getOrdinal = (n) => {
  const num = parseInt(n) || 1; 
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

const FacultySchedule = () => {
  const navigate = useNavigate();
  const { user, facultyInfo } = useAppContext(); 
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null); 
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Schedule Data Structure
  const [scheduleData, setScheduleData] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
  });

  // --- FETCH SCHEDULE ---
  const fetchSchedule = useCallback(async () => {
    if (!user?.token) return; 

    try {
      setLoading(true);
      const res = await axios.get('/api/faculty/schedule', { 
        headers: { Authorization: `Bearer ${user.token}` } 
      });

      if (res.data.success) {
        setScheduleData(prev => ({ ...prev, ...res.data.schedule }));
      }
    } catch (err) { 
      console.error("Fetch Schedule Error:", err); 
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- INITIAL EFFECT ---
  useEffect(() => {
    fetchSchedule(); 
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good Morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, [fetchSchedule]);

  // --- DELETE HANDLER ---
  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    try {
        const res = await axios.delete(`/api/faculty/schedule/${classToDelete}`, { 
            headers: { Authorization: `Bearer ${user.token}` } 
        });
        
        if (res.data.success) {
            toast.success("Class removed from schedule");
            setSelectedClass(null); 
            setClassToDelete(null); 
            fetchSchedule(); 
        }
    } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete class");
    }
  };

  if (loading && !scheduleData.Monday.length) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-14 w-14 bg-indigo-100 rounded-2xl mb-4 flex items-center justify-center">
                   <div className="h-6 w-6 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="h-4 w-40 bg-slate-200 rounded-full mb-2"></div>
                <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans p-6 lg:p-10 animate-fade-in-up">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                <Calendar size={32} />
              </div>
              {`${greeting}, ${facultyInfo?.name || "Professor"}`}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-[4.5rem]">Manage your weekly academic timeline.</p>
          </div>
          <button
            onClick={() => navigate('/faculty/add-schedule')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Add New Slot
          </button>
        </div>

        {/* SCHEDULE ROWS */}
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <DayRow 
              key={day} 
              dayName={day} 
              classes={scheduleData[day]} 
              onAdd={() => navigate('/faculty/add-schedule')}
              onClassClick={(cls) => setSelectedClass(cls)} 
            />
          ))}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selectedClass && (
        <ClassDetailsModal 
          data={selectedClass} 
          onClose={() => setSelectedClass(null)} 
          onDelete={() => setClassToDelete(selectedClass._id || selectedClass.id)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {classToDelete && (
        <DeleteConfirmationModal 
          onCancel={() => setClassToDelete(null)}
          onConfirm={confirmDeleteClass}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const DeleteConfirmationModal = ({ onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onCancel}>
      <div className="w-[400px] bg-white rounded-3xl shadow-2xl p-8 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mb-5 border-4 border-rose-100">
          <Trash2 className="text-rose-500" size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Remove Class Slot?</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Are you sure you want to remove this slot from your schedule? This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-200 transition-all active:scale-95">
            Yes, Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const DayRow = ({ dayName, classes, onAdd, onClassClick }) => {
  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === dayName;
  const shortDay = dayName.substring(0, 3).toUpperCase(); 

  return (
    <div className={`flex flex-col md:flex-row min-h-[140px] bg-white rounded-2xl overflow-hidden transition-all duration-200
      ${isToday 
        ? 'border-2 border-indigo-200 shadow-md shadow-indigo-100/40' 
        : 'border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'}`}
    >
      {/* Left Column (Day Indicator) */}
      <div className={`p-4 w-full md:w-32 flex-shrink-0 flex md:flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r 
        ${isToday ? 'bg-indigo-50/60 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}
      >
        <span className={`text-2xl md:text-3xl font-black tracking-tighter ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
          {shortDay}
        </span>
        {isToday && <span className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">Today</span>}
      </div>

      {/* Right Column (Classes) */}
      <div className="flex-1 p-5 lg:p-6 bg-white flex flex-wrap gap-4 items-center relative">
        {classes && classes.length > 0 ? (
          // BRUTE FORCE SORT 
          [...classes]
            .sort((a, b) => Number(a.periodIndex) - Number(b.periodIndex))
            .map((cls) => (
              <ClassBlock key={cls._id || cls.id} data={cls} onClick={() => onClassClick(cls)} />
            ))
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full py-4 opacity-50 select-none">
            <span className="text-sm font-medium text-slate-400 border border-dashed border-slate-200 px-6 py-3 rounded-xl bg-slate-50/50">
              No classes scheduled
            </span>
          </div>
        )}
        
        {/* Quick Add Button */}
        <button 
          onClick={onAdd}
          className="h-[120px] w-28 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group ml-auto md:ml-0 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
            <div className="p-2.5 bg-slate-50 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">
                <Plus size={20} className="group-hover:scale-110 transition-transform"/>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Add Slot</span>
        </button>
      </div>
    </div>
  );
};

const ClassBlock = ({ data, onClick }) => {
  const isLab = data.type === 'Lab';
  const isLeisure = data.type === 'Leisure';
  
  // Dynamic Styling based on Type
  let style = {
      bg: 'bg-white',
      border: 'border-slate-200',
      accent: 'bg-indigo-500',
      text: 'text-slate-800',
      subtext: 'text-slate-500',
      hover: 'hover:border-indigo-300 hover:shadow-indigo-100/50',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-600'
  };

  if (isLab) {
      style = {
          bg: 'bg-white',
          border: 'border-slate-200',
          accent: 'bg-purple-500',
          text: 'text-slate-800',
          subtext: 'text-slate-500',
          hover: 'hover:border-purple-300 hover:shadow-purple-100/50',
          badgeBg: 'bg-purple-50',
          badgeText: 'text-purple-600'
      };
  } else if (isLeisure) {
      style = {
          bg: 'bg-white',
          border: 'border-slate-200',
          accent: 'bg-emerald-400',
          text: 'text-slate-800',
          subtext: 'text-slate-400',
          hover: 'hover:border-emerald-300 hover:shadow-emerald-100/50',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-600'
      };
  }

  return (
    <div 
        onClick={onClick} 
        className={`relative w-full md:w-64 p-4 rounded-xl border shadow-sm ${style.bg} ${style.border} ${style.hover} transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group flex flex-col justify-between min-h-[120px]`}
    >
      {/* Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${style.accent}`} />
      
      <div className="pl-3 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-2">
          <h4 className={`font-bold text-base line-clamp-1 ${style.text}`} title={data.subject}>
            {data.subject || "Leisure"}
          </h4>
          {isLab && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}>LAB</span>}
          {isLeisure && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}>FREE</span>}
        </div>

        {!isLeisure ? (
           <div className="space-y-1.5 mb-4">
              <div className={`flex items-center text-xs font-semibold ${style.subtext}`}>
                 <Layers size={14} className="mr-2 opacity-50" /> 
                 <span className="truncate">{data.branch} • {getOrdinal(data.year)} Year</span>
              </div>
              <div className={`flex items-center text-xs font-semibold ${style.subtext}`}>
                 <MapPin size={14} className="mr-2 opacity-50" /> 
                 <span className="truncate">Room {data.room}</span>
              </div>
           </div>
        ) : (
            <p className="text-xs font-medium text-slate-400 italic mb-4">Personal Time</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${style.subtext}`}>
                <Clock size={12} className="opacity-70" /> {data.time || `${data.startTime} - ${data.endTime}`}
            </div>
            {/* Batch/Section Pill */}
            {!isLeisure && (
                <div className="text-[10px] font-bold bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-slate-500">
                    {isLab ? `Batch ${data.batch}` : `Sec ${data.section}`}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ClassDetailsModal = ({ data, onClose, onDelete }) => {
  if (!data) return null;
  const isLab = data.type === 'Lab';
  const isLeisure = data.type === 'Leisure';
  
  const theme = isLab 
    ? { bg: 'bg-purple-600', badge: 'bg-purple-500/30 text-white border-purple-400', icon: 'text-purple-300' } 
    : isLeisure 
    ? { bg: 'bg-emerald-500', badge: 'bg-emerald-400/30 text-white border-emerald-300', icon: 'text-emerald-200' } 
    : { bg: 'bg-indigo-600', badge: 'bg-indigo-500/30 text-white border-indigo-400', icon: 'text-indigo-300' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-[500px] max-w-full bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className={`px-8 py-8 ${theme.bg} relative overflow-hidden`}>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 shadow-sm border ${theme.badge}`}>
                {isLab ? 'Laboratory Session' : isLeisure ? 'Leisure / Free Period' : 'Lecture Session'}
              </div>
              <h2 className="text-2xl font-extrabold text-white leading-tight">{data.subject || "Free Period"}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors backdrop-blur-md">
              <X size={20} />
            </button>
          </div>
          {/* Decorative Icon */}
          <Grid className={`absolute -bottom-8 -right-8 w-40 h-40 ${theme.icon} opacity-20 rotate-12`} />
        </div>

        {/* Modal Body */}
        <div className="p-8 bg-white">
           <div className="grid grid-cols-2 gap-y-8 gap-x-6">
              <DetailItem label="Time Slot" value={data.time || `${data.startTime} - ${data.endTime}`} icon={<Clock size={16}/>} />
              <DetailItem label="Room Number" value={data.room} icon={<MapPin size={16}/>} />
              <DetailItem label="Class Details" value={`${data.branch || "CSE"} • ${getOrdinal(data.year)} Year`} icon={<Layers size={16}/>} />
              <DetailItem 
                label={isLab ? "Lab Batch" : "Section"} 
                value={isLab ? `Batch ${data.batch}` : `Section ${data.section}`} 
                icon={<Grid size={16}/>} 
              />
           </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 flex justify-end bg-slate-50 border-t border-slate-100">
           <button 
             onClick={onDelete} 
             className="px-6 py-2.5 text-sm font-bold text-rose-600 bg-white border border-rose-200 shadow-sm hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl flex items-center gap-2 transition-all active:scale-95"
           >
             <Trash2 size={16} /> Remove Class Slot
           </button>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }) => (
    <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
            {icon} {label}
        </div>
        <p className="font-bold text-slate-800 text-lg">{value || "N/A"}</p>
    </div>
);

export default FacultySchedule;