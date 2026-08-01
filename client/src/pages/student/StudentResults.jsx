import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiAward, FiTrendingUp, FiTarget, 
  FiCheckCircle, FiAlertCircle, FiBook, FiUser, FiCalendar, FiMessageSquare, FiPieChart
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentResults = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    totalObtained: 0, 
    totalMax: 0      
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/my-results`, { 
          withCredentials: true 
        });
        
        if (data.success && data.results) {
          const fetchedResults = data.results;
          setResults(fetchedResults);

          if (fetchedResults.length > 0) {
            let totalPercentage = 0;
            let highest = 0;
            let sumObtained = 0;
            let sumMax = 0;

            fetchedResults.forEach(r => {
              if (r.examId?.maxMarks) {
                const percentage = (r.marksObtained / r.examId.maxMarks) * 100;
                totalPercentage += percentage;
                if (percentage > highest) highest = percentage;
                
                sumObtained += r.marksObtained;
                sumMax += r.examId.maxMarks;
              }
            });

            setAnalytics({
              totalExams: fetchedResults.length,
              averageScore: totalPercentage / fetchedResults.length,
              highestScore: highest,
              totalObtained: sumObtained,
              totalMax: sumMax
            });
          }
        }
      } catch (error) {
        toast.error("Failed to load exam results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Analyzing academic records...</p>
      </div>
    );
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return { text: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', bar: 'bg-teal-500' };
    if (percentage >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', bar: 'bg-amber-500' };
    return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', bar: 'bg-rose-500' };
  };

  const overallPercentage = analytics.totalMax > 0 
    ? ((analytics.totalObtained / analytics.totalMax) * 100).toFixed(1) 
    : 0;

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      {/* Analytics Row */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Exams Completed</p>
              <h3 className="text-3xl font-black text-slate-800">{analytics.totalExams}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiCheckCircle size={24} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Average Score
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {analytics.averageScore.toFixed(1)}%
              </h3>
            </div>

            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiTrendingUp size={24} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Highest Score</p>
              <h3 className="text-3xl font-black text-slate-800">{analytics.highestScore.toFixed(1)}%</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FiTarget size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      {results.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <FiAward size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-600 mb-2">No Results Found</h3>
          <p className="text-slate-400 font-medium max-w-md mx-auto">
            You haven't taken any exams yet, or your teachers haven't uploaded the marks.
          </p>
        </div>
      ) : (
        <div className="space-y-6 relative pb-24">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Individual Exam Reports
          </h3>
          
          {results.map((result) => {
            const maxMarks = result.examId?.maxMarks || 100;
            const percentage = (result.marksObtained / maxMarks) * 100;
            const theme = getScoreColor(percentage);

            return (
              <div 
                key={result._id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row gap-6 items-center"
              >
                
                {/* Score Circle */}
                <div className="shrink-0 flex flex-col items-center justify-center">
                  <div className={`relative w-24 h-24 flex items-center justify-center rounded-full border-[6px] ${theme.border} ${theme.bg}`}>
                    <span className={`text-2xl font-black ${theme.text}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-wider mt-2 ${theme.text}`}>
                    {percentage >= 50 ? 'Passed' : 'Needs Work'}
                  </p>
                </div>

                {/* Exam Details */}
                <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-indigo-100">
                      {result.examId?.subject || "Subject"}
                    </span>
                    <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                      <FiCalendar /> 
                      {result.examId?.examDate ? new Date(result.examId.examDate).toLocaleDateString('en-GB') : "N/A"}
                    </span>
                  </div>
                  
                  {/* 🚨 FIXED: Mapping examTerm instead of hardcoded Term Examination */}
                  <h2 className="text-xl font-black text-slate-800 mb-1">{result.examId?.examTerm || result.examId?.title || "Examination"}</h2>
                  
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-4">
                    <FiUser className="text-slate-400" /> Evaluated by {result.teacherId?.name || "Instructor"}
                  </p>

                  {/* Marks Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                      <span>Marks Obtained: {result.marksObtained}</span>
                      <span>Max Marks: {maxMarks}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${theme.bar}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="w-full md:w-64 shrink-0 bg-slate-50 rounded-2xl p-4 border border-slate-100 h-full flex flex-col justify-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <FiMessageSquare /> Teacher's Remarks
                  </h4>
                  {result.remarks ? (
                    <p className="text-sm font-medium text-slate-700 italic leading-relaxed">"{result.remarks}"</p>
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">No remarks provided for this examination.</p>
                  )}
                </div>

              </div>
            );
          })}

          {/* Overall Performance Summary */}
          {results.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100 shrink-0">
                  <FiPieChart size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-indigo-900">Overall Performance Summary</h3>
                  <p className="text-sm font-medium text-indigo-600/80 mt-0.5">Cumulative evaluation of all completed examinations.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-8 bg-white px-6 py-4 rounded-2xl border border-indigo-100 shadow-sm w-full md:w-auto">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Obtained</p>
                  <p className="text-2xl font-black text-slate-800 leading-none mt-1">{analytics.totalObtained}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Max Marks</p>
                  <p className="text-2xl font-black text-slate-800 leading-none mt-1">{analytics.totalMax}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total %</p>
                  <p className={`text-2xl font-black leading-none mt-1 ${overallPercentage >= 50 ? 'text-teal-600' : 'text-rose-600'}`}>
                    {overallPercentage}%
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default StudentResults;