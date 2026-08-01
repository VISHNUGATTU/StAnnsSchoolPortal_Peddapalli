import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiFileText, FiSearch, FiEdit, FiSave, FiX, 
  FiPlus, FiTrash2, FiClock, FiBookOpen, FiMapPin, FiCalendar, FiAward
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const ExamScheduleManagement = () => {
  const { backendUrl } = useAppContext();
  
  // 1. Search State
  const [searchParams, setSearchParams] = useState({
    examTerm: 'Mid-Term Examination',
    grade: '1'
  });
  
  // 2. Data State
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleFetched, setScheduleFetched] = useState(false);
  
  // 3. Exam Schedule State (Array of exam sessions)
  const [examSchedule, setExamSchedule] = useState([]);

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
      const { data } = await axios.get(`${backendUrl}/api/admin/exams/schedule`, {
        params: { examTerm: searchParams.examTerm, grade: searchParams.grade },
        withCredentials: true
      });

      if (data.success && data.schedule && data.schedule.exams.length > 0) {
        const examsWithIds = data.schedule.exams.map(ex => ({ ...ex, id: Date.now() + Math.random(), maxMarks: ex.maxMarks || 100 }));
        examsWithIds.sort((a, b) => new Date(a.date) - new Date(b.date));
        setExamSchedule(examsWithIds);
      } else {
        setExamSchedule([]);
        toast.success(`No schedule found. Click Edit to create one.`);
      }
      setScheduleFetched(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setExamSchedule([]);
        setScheduleFetched(true);
        toast.success(`No schedule found. Click Edit to create one.`);
      } else {
        toast.error("Failed to fetch exam schedule.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddExam = () => {
    setExamSchedule(prev => [
      ...prev, 
      { id: Date.now().toString(), date: '', subject: '', startTime: '09:00', endTime: '12:00', room: '', maxMarks: 100 }
    ]);
  };

  const handleUpdateExam = (index, field, value) => {
    setExamSchedule(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteExam = (index) => {
    setExamSchedule(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSave = async () => {
    const isValid = examSchedule.every(ex => ex.date && ex.subject && ex.startTime && ex.endTime && ex.maxMarks);
    if (!isValid) {
      return toast.error("Please fill in all required fields (Date, Subject, Timings, Marks) for every row.");
    }

    setLoading(true);
    try {
      const cleanExams = examSchedule.map(({ id, _id, ...rest }) => rest);
      
      const payload = {
        examTerm: searchParams.examTerm,
        grade: searchParams.grade,
        exams: cleanExams
      };

      const { data } = await axios.post(`${backendUrl}/api/admin/exams/schedule/save`, payload, {
        withCredentials: true
      });

      if (data.success) {
        toast.success(`Exam Schedule saved successfully!`);
        
        const sorted = [...examSchedule].sort((a, b) => new Date(a.date) - new Date(b.date));
        setExamSchedule(sorted);
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save exam schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
            <FiFileText className="text-violet-600" /> Exam Scheduling
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage assessment dates, subjects, and examination rooms.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/40 mb-8">
        <form onSubmit={handleFetch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Examination Term</label>
              <select name="examTerm" value={searchParams.examTerm} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-navy font-medium">
                {["Formative Assessment (FA) 1", "Formative Assessment (FA) 2", "Summative Assessment (SA) 1", "Formative Assessment (FA) 3", "Formative Assessment (FA) 4", "Summative Assessment (SA) 2", "Mid-Term Examination"].map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Target Grade/Class</label>
              <select name="grade" value={searchParams.grade} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-navy font-medium">
                {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => (
                  <option key={g} value={g}>Class {g}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 w-full md:w-auto h-full min-h-[48px]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiSearch /> Fetch Exams</>}
          </button>
        </form>
      </div>

      {scheduleFetched && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
          
          <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                Class {searchParams.grade} <span className="text-slate-400 font-normal">|</span> 
                {/* 🚨 DYNAMICALLY BOUND TO SEARCH PARAMS */}
                <span className="text-violet-600">{searchParams.examTerm}</span>
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {isEditing ? 'Editing Mode Active - Add or remove exam dates' : 'View Mode - Read Only'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors flex items-center gap-2 shadow-md shadow-navy/20"
                >
                  <FiEdit /> Edit Schedule
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      handleFetch({ preventDefault: () => {} });
                    }}
                    className="px-6 py-2.5 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-colors flex items-center gap-2"
                  >
                    <FiX /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-2 shadow-md shadow-violet-600/20"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />} 
                    Save Schedule
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6 bg-white min-h-[300px]">
            
            {examSchedule.length === 0 && !isEditing && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <FiFileText size={48} className="mb-4 text-slate-200" />
                <p className="font-medium text-lg">No exams scheduled for this term.</p>
              </div>
            )}

            <div className="space-y-4">
              {examSchedule.map((exam, index) => (
                <div key={exam.id} className={`relative p-5 rounded-2xl border transition-all ${isEditing ? 'border-violet-200 bg-violet-50/30' : 'border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4'}`}>
                  
                  {isEditing && (
                    <button 
                      onClick={() => handleDeleteExam(index)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-rose-200 text-rose-500 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-500 hover:text-white transition-colors z-10"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}

                  {!isEditing ? (
                    <>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase">{new Date(exam.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                          <span className="text-xl font-black text-violet-600">{new Date(exam.date).getDate()}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-navy flex items-center gap-2"><FiBookOpen className="text-violet-500" /> {exam.subject}</h3>
                          <p className="text-sm font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5"><FiClock /> {exam.startTime} - {exam.endTime}</span>
                            {exam.room && <span className="flex items-center gap-1.5"><FiMapPin /> Room: {exam.room}</span>}
                            <span className="flex items-center gap-1.5"><FiAward /> Marks: {exam.maxMarks || 100}</span>
                          </p>
                        </div>
                      </div>
                      <div className="hidden md:block text-right">
                        <span className="text-xs font-bold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">{searchParams.examTerm}</span>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiCalendar /> Date *</label>
                        <input 
                          type="date" value={exam.date ? new Date(exam.date).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleUpdateExam(index, 'date', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiBookOpen /> Subject *</label>
                        <input 
                          type="text" placeholder="e.g. Maths" value={exam.subject}
                          onChange={(e) => handleUpdateExam(index, 'subject', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiClock /> Start *</label>
                        <input 
                          type="time" value={exam.startTime}
                          onChange={(e) => handleUpdateExam(index, 'startTime', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-600 text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiClock /> End *</label>
                        <input 
                          type="time" value={exam.endTime}
                          onChange={(e) => handleUpdateExam(index, 'endTime', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-600 text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiMapPin /> Room</label>
                        <input 
                          type="text" placeholder="e.g. 101" value={exam.room}
                          onChange={(e) => handleUpdateExam(index, 'room', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">Marks</label>
                        <input 
                          type="number" placeholder="100" value={exam.maxMarks || ''}
                          onChange={(e) => handleUpdateExam(index, 'maxMarks', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium text-center"
                        />
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {isEditing && (
              <button 
                type="button" 
                onClick={handleAddExam}
                className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
              >
                <FiPlus size={20} /> Add Exam Subject
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ExamScheduleManagement;