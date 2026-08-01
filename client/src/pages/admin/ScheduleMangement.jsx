import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCalendar, FiSearch, FiEdit, FiSave, FiX, 
  FiPlus, FiTrash2, FiClock, FiBookOpen, FiUser, FiMapPin
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const ScheduleManagement = () => {
  const { backendUrl } = useAppContext();
  
  // 1. Search State
  const [searchParams, setSearchParams] = useState({
    grade: '1',
    section: 'A'
  });
  
  // 2. Data State
  const [loading, setLoading] = useState(false);
  const [fetchingTeachers, setFetchingTeachers] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleFetched, setScheduleFetched] = useState(false);
  
  // 3. Timetable State (Grouped by Day)
  const defaultWeek = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
  };
  const [weeklySchedule, setWeeklySchedule] = useState(defaultWeek);
  
  // Fetch teachers for the dropdown in edit mode
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/teachers/all`, { withCredentials: true });
        if (data.success) setTeachers(data.teachers);
      } catch (error) {
        toast.error("Failed to load teachers");
      } finally {
        setFetchingTeachers(false);
      }
    };
    fetchTeachers();
  }, [backendUrl]);

  const handleSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    setScheduleFetched(false);
    setIsEditing(false);
  };

  const handleFetch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsEditing(false);
    
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/schedule`, {
        params: { grade: searchParams.grade, section: searchParams.section },
        withCredentials: true
      });

      if (data.success && data.schedules) {
        const fetchedWeek = { ...defaultWeek };
        data.schedules.forEach(daySchedule => {
          if (fetchedWeek[daySchedule.day]) {
            fetchedWeek[daySchedule.day] = daySchedule.periods || [];
          }
        });
        setWeeklySchedule(fetchedWeek);
      } else {
        setWeeklySchedule(defaultWeek);
        toast.success(`No existing schedule found. You can edit to create one.`);
      }
      setScheduleFetched(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setWeeklySchedule(defaultWeek);
        setScheduleFetched(true);
        toast.success(`No schedule found for ${searchParams.grade}-${searchParams.section}. Click Edit to create one.`);
      } else {
        toast.error("Failed to fetch schedule.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Editing Functions ---
  const handleAddPeriod = (day) => {
    setWeeklySchedule(prev => ({
      ...prev,
      // 🚨 FIXED: Added 'room' property to initial state
      [day]: [...prev[day], { id: Date.now().toString(), periodName: '', startTime: '', endTime: '', subject: '', teacherId: '', room: '' }]
    }));
  };

  const handleUpdatePeriod = (day, periodIndex, field, value) => {
    setWeeklySchedule(prev => {
      const updatedDay = [...prev[day]];
      updatedDay[periodIndex] = { ...updatedDay[periodIndex], [field]: value };
      return { ...prev, [day]: updatedDay };
    });
  };

  const handleDeletePeriod = (day, periodIndex) => {
    setWeeklySchedule(prev => {
      const updatedDay = [...prev[day]];
      updatedDay.splice(periodIndex, 1);
      return { ...prev, [day]: updatedDay };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        grade: searchParams.grade,
        section: searchParams.section,
        weeklyData: Object.entries(weeklySchedule).map(([day, periods]) => ({
          day,
          periods: periods.map(({ _id, id, ...rest }) => rest)
        })).filter(dayData => dayData.periods.length > 0) 
      };

      const { data } = await axios.post(`${backendUrl}/api/admin/schedule/save-week`, payload, {
        withCredentials: true
      });

      if (data.success) {
        toast.success(`Timetable updated successfully!`);
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save timetable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
          <FiCalendar className="text-indigo-600" /> Master Timetable
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Fetch, view, and modify weekly schedules by Class and Section.</p>
      </div>

      {/* SEARCH BAR (TOP BLOCK) */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/40 mb-8">
        <form onSubmit={handleFetch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Grade/Class</label>
              <select name="grade" value={searchParams.grade} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-medium">
                {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => (
                  <option key={g} value={g}>Class {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Section</label>
              <select name="section" value={searchParams.section} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-medium">
                {["A", "B", "C", "D"].map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 w-full md:w-auto h-full min-h-[48px]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiSearch /> Fetch Timetable</>}
          </button>
        </form>
      </div>

      {/* TIMETABLE DISPLAY AREA (BOTTOM BLOCK) */}
      {scheduleFetched && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
          
          {/* Action Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-navy">
                Timetable: Class {searchParams.grade}-{searchParams.section}
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {isEditing ? 'Editing Mode Active - Make changes below' : 'View Mode - Read Only'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors flex items-center gap-2 shadow-md shadow-navy/20"
                >
                  <FiEdit /> Edit Timetable
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      handleFetch({ preventDefault: () => {} }); // Reload original data
                    }}
                    className="px-6 py-2.5 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-colors flex items-center gap-2"
                  >
                    <FiX /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />} 
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Days Loop */}
          <div className="p-6 space-y-8">
            {Object.keys(defaultWeek).map((day) => (
              <div key={day} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Day Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-navy text-lg">{day}</h3>
                  {isEditing && (
                    <button 
                      onClick={() => handleAddPeriod(day)}
                      className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <FiPlus /> Add Period
                    </button>
                  )}
                </div>

                {/* Periods Content */}
                <div className="p-4 bg-white overflow-x-auto">
                  {weeklySchedule[day].length === 0 ? (
                    <p className="text-slate-400 text-sm font-medium italic py-2">No classes scheduled for {day}.</p>
                  ) : (
                    <div className="flex gap-4 min-w-max">
                      {weeklySchedule[day].map((period, index) => (
                        
                        /* Single Period Card */
                        <div key={index} className={`relative p-4 rounded-xl border w-64 shrink-0 transition-colors ${isEditing ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-slate-50'}`}>
                          
                          {isEditing && (
                            <button 
                              onClick={() => handleDeletePeriod(day, index)}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-rose-200 text-rose-500 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-500 hover:text-white transition-colors z-10"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          )}

                          {!isEditing ? (
                            /* VIEW MODE */
                            <div className="space-y-2">
                              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                                <span className="text-xs font-bold bg-navy text-white px-2 py-0.5 rounded uppercase tracking-wider">{period.periodName}</span>
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><FiClock size={12}/> {period.startTime} - {period.endTime}</span>
                              </div>
                              <p className="font-bold text-navy flex items-center gap-2"><FiBookOpen className="text-indigo-500"/> {period.subject}</p>
                              {period.teacherId && (
                                <p className="text-sm text-slate-500 font-medium flex items-center gap-2"><FiUser className="text-slate-400"/> 
                                  {teachers.find(t => t._id === (typeof period.teacherId === 'object' ? period.teacherId._id : period.teacherId))?.name || 'Assigned'}
                                </p>
                              )}
                              {/* 🚨 ADDED: Room display in view mode */}
                              <p className="text-sm text-slate-500 font-medium flex items-center gap-2"><FiMapPin className="text-amber-500"/> Room: {period.room || 'TBA'}</p>
                            </div>
                          ) : (
                            /* EDIT MODE */
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input 
                                  type="text" placeholder="Period (e.g. 1)" value={period.periodName}
                                  onChange={(e) => handleUpdatePeriod(day, index, 'periodName', e.target.value)}
                                  className="w-1/3 text-xs font-bold bg-white border border-slate-200 rounded p-1.5 outline-none focus:border-indigo-500 uppercase text-center"
                                />
                                <input 
                                  type="time" value={period.startTime}
                                  onChange={(e) => handleUpdatePeriod(day, index, 'startTime', e.target.value)}
                                  className="w-1/3 text-xs bg-white border border-slate-200 rounded p-1.5 outline-none focus:border-indigo-500 text-slate-600"
                                />
                                <input 
                                  type="time" value={period.endTime}
                                  onChange={(e) => handleUpdatePeriod(day, index, 'endTime', e.target.value)}
                                  className="w-1/3 text-xs bg-white border border-slate-200 rounded p-1.5 outline-none focus:border-indigo-500 text-slate-600"
                                />
                              </div>
                              <input 
                                type="text" placeholder="Subject Name" value={period.subject}
                                onChange={(e) => handleUpdatePeriod(day, index, 'subject', e.target.value)}
                                className="w-full text-sm font-bold text-navy bg-white border border-slate-200 rounded p-2 outline-none focus:border-indigo-500"
                              />
                              <select 
                                value={typeof period.teacherId === 'object' ? period.teacherId?._id : (period.teacherId || '')}
                                onChange={(e) => handleUpdatePeriod(day, index, 'teacherId', e.target.value)}
                                className="w-full text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded p-2 outline-none focus:border-indigo-500"
                              >
                                <option value="">-- No Teacher --</option>
                                {teachers.map(t => (
                                  <option key={t._id} value={t._id}>{t.name}</option>
                                ))}
                              </select>
                              {/* 🚨 ADDED: Room input field in edit mode */}
                              <input 
                                type="text" placeholder="Room Number / Lab" value={period.room || ''}
                                onChange={(e) => handleUpdatePeriod(day, index, 'room', e.target.value)}
                                className="w-full text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded p-2 outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;