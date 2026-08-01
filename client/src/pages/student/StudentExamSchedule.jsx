import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiFileText, FiCalendar, FiClock, 
  FiMapPin, FiAward, FiAlertCircle 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentExamSchedule = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/exam-schedule`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          setExams(data.exams);
        }
      } catch (error) {
        toast.error("Failed to load exam schedule.");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading exam schedule...</p>
      </div>
    );
  }

  // Get start of today for accurate date comparisons
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine status of an exam
  const getExamStatus = (dateString) => {
    const examDate = new Date(dateString);
    examDate.setHours(0, 0, 0, 0);
    
    if (examDate < today) return { label: 'Completed', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (examDate.getTime() === today.getTime()) return { label: 'Today', color: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' };
    return { label: 'Upcoming', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      {exams.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <FiAward size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-600 mb-2">No Exams Scheduled</h3>
          <p className="text-slate-400 font-medium max-w-md mx-auto">
            There are currently no examinations scheduled for your class. Check back later or ask your class teacher.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const status = getExamStatus(exam.examDate);
            const isCompleted = status.label === 'Completed';

            return (
              <div 
                key={exam._id} 
                className={`bg-white rounded-3xl border p-6 transition-all group relative overflow-hidden ${
                  isCompleted 
                    ? 'border-slate-200 opacity-80' 
                    : 'border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-lg hover:shadow-indigo-600/10'
                }`}
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    isCompleted ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform'
                  }`}>
                    <FiFileText size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Exam Info */}
                <h3 className={`text-xl font-black mb-1 ${isCompleted ? 'text-slate-600' : 'text-slate-800'}`}>
                  {exam.subject}
                </h3>
                {/* 🚨 FIXED: Now correctly rendering exam.examTerm mapped directly from the database schema */}
                <p className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">
                  {exam.examTerm || exam.title || "Term Examination"}
                </p>

                {/* Details Grid */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <FiCalendar />
                    </div>
                    <span className={isCompleted ? 'text-slate-500' : 'text-slate-700'}>
                      {new Date(exam.examDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <FiClock />
                    </div>
                    <span className={isCompleted ? 'text-slate-500' : 'text-slate-700'}>
                      {exam.startTime || "09:00 AM"} - {exam.endTime || "12:00 PM"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <FiMapPin />
                    </div>
                    <span className={isCompleted ? 'text-slate-500' : 'text-slate-700'}>
                      Room {exam.room || "TBA"}
                    </span>
                  </div>
                </div>

                {/* Footer Max Marks */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <FiAlertCircle /> Max Marks
                  </span>
                  <span className="text-sm font-black text-slate-700 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
                    {exam.maxMarks || 100}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default StudentExamSchedule;