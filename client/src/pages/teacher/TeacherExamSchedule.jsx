import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCalendar, FiFilter, FiClock, FiBookOpen, 
  FiAward, FiSearch, FiAlertCircle 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherExamSchedule = () => {
  const { backendUrl } = useAppContext();
  
  // State
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    grade: '',
    section: ''
  });

  const grades = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C", "D"];

  const fetchExams = async () => {
    setLoading(true);
    try {
      // Build query string based on active filters
      let query = '?';
      if (filters.grade) query += `grade=${filters.grade}&`;
      if (filters.section) query += `section=${filters.section}`;

      const { data } = await axios.get(`${backendUrl}/api/teacher/exams${query}`, {
        withCredentials: true
      });

      if (data.success) {
        setExams(data.exams);
      }
    } catch (err) {
      console.error("Fetch Exams Error:", err);
      setError("Failed to load the exam schedule. Please try again.");
      toast.error("Could not fetch exams.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all exams on initial mount, and re-fetch when user submits the filter
  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchExams();
  };

  const clearFilters = () => {
    setFilters({ grade: '', section: '' });
    // We have to wait for state to update, or just force the fetch without params
    setTimeout(() => {
      fetchExams();
    }, 0);
  };

  // Format dates beautifully
  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  // Check if exam is in the past, today, or future to color-code it
  const getExamStatus = (dateString) => {
    if (!dateString) return 'upcoming';
    const examDate = new Date(dateString);
    const today = new Date();
    
    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (examDate < today) return 'completed';
    if (examDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans mt-4">
      
      {/* Filter Bar (Glassmorphism styling) */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/40 mb-8">
        <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row items-end gap-4">
          
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <FiFilter /> Filter by Class
            </label>
            <select 
              name="grade" 
              value={filters.grade} 
              onChange={handleFilterChange} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-700 font-bold"
            >
              <option value="">All Classes</option>
              {grades.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section</label>
            <select 
              name="section" 
              value={filters.section} 
              onChange={handleFilterChange} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-700 font-bold"
            >
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
            <button 
              type="button" 
              onClick={clearFilters}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Reset
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 flex-1 md:flex-none"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSearch />}
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="p-6 text-center bg-rose-50 rounded-3xl border border-rose-200 mt-10 max-w-lg mx-auto">
          <FiAlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
          <h3 className="text-rose-800 font-bold text-lg mb-1">Error Loading Data</h3>
          <p className="text-rose-600 font-medium text-sm">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse">Fetching exam schedules...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <FiCalendar size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-bold text-xl text-slate-700 mb-1">No Exams Scheduled</h3>
          <p className="text-sm text-slate-500 font-medium">There are currently no exams matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const status = getExamStatus(exam.examDate);
            
            return (
              <div 
                key={exam._id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between relative overflow-hidden">
                  {/* Subtle background glow based on status */}
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
                    status === 'today' ? 'bg-amber-500' : status === 'completed' ? 'bg-teal-500' : 'bg-indigo-500'
                  }`}></div>
                  
                  <div className="relative z-10">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                      <FiBookOpen /> {exam.examType || 'Examination'}
                    </p>
                    <h3 className="font-black text-xl text-slate-800 leading-tight">
                      {exam.subject}
                    </h3>
                  </div>
                  
                  <div className="relative z-10">
                    {status === 'today' && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg animate-pulse border border-amber-200">
                        Today
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-teal-100">
                        Finished
                      </span>
                    )}
                    {status === 'upcoming' && (
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-indigo-100">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-teal-500 transition-colors">
                      <FiCalendar size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                      <p className="font-bold text-slate-700">{formatDate(exam.examDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <FiClock size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</p>
                      <p className="font-bold text-slate-700">{exam.startTime || 'TBA'} - {exam.endTime || 'TBA'}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Class Target</p>
                    <p className="font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                      {exam.grade}-{exam.section}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1">
                      <FiAward /> Max Marks
                    </p>
                    <p className="font-black text-slate-700 text-lg mt-0.5">{exam.maxMarks || '--'}</p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TeacherExamSchedule;