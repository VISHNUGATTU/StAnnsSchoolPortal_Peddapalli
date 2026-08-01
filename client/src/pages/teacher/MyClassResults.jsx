import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiDownload, FiAlertCircle, FiChevronRight, FiUserCheck, FiLayout, FiBook 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const MyClassResults = () => {
  const { backendUrl } = useAppContext();
  
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(''); 
  const [mode, setMode] = useState('select'); 
  
  const [examTerms, setExamTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [matrixData, setMatrixData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectStats, setSubjectStats] = useState({});
  const [overallPercentage, setOverallPercentage] = useState(0);
  
  const [identifier, setIdentifier] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentHistory, setStudentHistory] = useState({});

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/teacher/my-class/assignments`, { withCredentials: true });
        if (data.success) {
          setAssignedClasses(data.classes);
        }
      } catch (err) {
        toast.error("Failed to fetch assigned classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [backendUrl]);

  useEffect(() => {
    if (mode === 'matrix' && selectedClass) {
      const loadTerms = async () => {
        try {
          const [grade, section] = selectedClass.split('-');
          const { data } = await axios.get(`${backendUrl}/api/teacher/my-class/exam-terms?grade=${grade}&section=${section}`, { withCredentials: true });
          if (data.success) {
            setExamTerms(data.terms);
          }
        } catch(e) {
          toast.error("Failed to load exam terms.");
        }
      };
      loadTerms();
    }
  }, [mode, selectedClass, backendUrl]);

  const handleFetchMatrix = async () => {
    if (!selectedTerm) return toast.error("Select an exam term first.");
    setDataLoading(true);
    try {
      const [grade, section] = selectedClass.split('-');
      const { data } = await axios.get(`${backendUrl}/api/teacher/my-class/matrix`, {
        params: { grade, section, examTerm: selectedTerm },
        withCredentials: true
      });
      if (data.success) {
        setMatrixData(data.matrix);
        setSubjects(data.subjects);
        setSubjectStats(data.subjectStats);
        setOverallPercentage(data.overallClassPercentage);
      }
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to load matrix.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleStudentSearch = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error("Enter Roll or AdNo.");
    setDataLoading(true);
    try {
      const [grade, section] = selectedClass.split('-');
      const { data } = await axios.get(`${backendUrl}/api/teacher/my-class/student-lookup`, {
        params: { grade, section, identifier },
        withCredentials: true
      });
      if (data.success) {
        setStudentInfo(data.student);
        setStudentHistory(data.history);
      }
    } catch(e) {
      setStudentInfo(null);
      setStudentHistory({});
      toast.error(e.response?.data?.message || "Student not found.");
    } finally {
      setDataLoading(false);
    }
  };

  const exportMatrixCSV = () => {
    if (!matrixData.length) return toast.error("No data to export.");
    let csv = `Class: ${selectedClass}, Exam Term: ${selectedTerm}\n\n`;
    csv += 'Roll No,Name,';
    subjects.forEach(s => csv += `${s.name},`);
    csv += 'Total Obtained,Total Max,Percentage\n';

    matrixData.forEach(row => {
      csv += `${row.rollno},${row.name},`;
      subjects.forEach(s => csv += `${row.subjectMarks[s.name]},`);
      csv += `${row.totalObtained},${row.totalMax},${row.percentage}%\n`;
    });

    csv += 'AVERAGE,-,';
    subjects.forEach(s => csv += `${subjectStats[s.name]?.average || '-'},`);
    csv += `-,-,${overallPercentage}%\n`;

    csv += 'HIGHEST,-,';
    subjects.forEach(s => csv += `${subjectStats[s.name]?.highest || '-'},`);
    csv += `-,-,-\n`;

    csv += 'LOWEST,-,';
    subjects.forEach(s => csv += `${subjectStats[s.name]?.lowest || '-'},`);
    csv += `-,-,-\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Class_Matrix_${selectedClass}_${selectedTerm}.csv`;
    link.click();
  };

  const exportStudentCSV = () => {
    if (!studentInfo) return toast.error("No student data to export.");
    let csv = `Student: ${studentInfo.name}, Roll No: ${studentInfo.rollno}, Class: ${selectedClass}\n\n`;
    
    Object.keys(studentHistory).forEach(term => {
      csv += `--- ${term} ---\nSubject,Marks Obtained,Max Marks\n`;
      studentHistory[term].results.forEach(r => {
        csv += `${r.examId.subject},${r.marksObtained},${r.examId.maxMarks || 100}\n`;
      });
      const termPer = ((studentHistory[term].totalObtained / studentHistory[term].totalMax) * 100).toFixed(1);
      csv += `TOTAL,${studentHistory[term].totalObtained},${studentHistory[term].totalMax}\n`;
      csv += `PERCENTAGE,${termPer}%,-\n\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${studentInfo.name}_History.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold">Verifying class assignments...</p>
      </div>
    );
  }

  if (assignedClasses.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 max-w-2xl mx-auto mt-10">
        <FiAlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="font-bold text-xl text-slate-700 mb-1">No Assigned Classes</h3>
        <p className="text-sm text-slate-500 font-medium px-6">
          You are not currently designated as a Class Teacher for any section this academic year. 
          Contact administration to have a class assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-sans pb-12 w-full mt-4">
      
      {/* Top Controller Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Class Selector */}
        <div className="w-full md:w-auto flex items-center gap-3">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Target Class</label>
          <select 
            value={selectedClass} 
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setMode('select');
              setMatrixData([]);
              setStudentInfo(null);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-bold min-w-[150px]"
          >
            <option value="">-- Select Class --</option>
            {assignedClasses.map((cls, idx) => (
              <option key={idx} value={`${cls.grade}-${cls.section}`}>Class {cls.grade}-{cls.section}</option>
            ))}
          </select>
        </div>

        {/* 🚨 FIXED: Upgraded modern soft-pill mode toggles */}
        {selectedClass && (
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl w-full md:w-auto shrink-0 border border-slate-200/60">
            <button 
              onClick={() => setMode('matrix')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'matrix' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <FiLayout size={18} className={mode === 'matrix' ? 'text-indigo-500' : 'opacity-70'}/> Class Matrix
            </button>
            <button 
              onClick={() => setMode('student')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'student' ? 'bg-white text-teal-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <FiUserCheck size={18} className={mode === 'student' ? 'text-teal-500' : 'opacity-70'}/> Student Lookup
            </button>
          </div>
        )}
      </div>

      {!selectedClass && mode === 'select' && (
        <div className="text-center py-20 text-slate-400 font-medium">
          Please select a class from the dropdown above to view results.
        </div>
      )}

      {/* ========================================= */}
      {/* MODE 1: CLASS MATRIX VIEW                 */}
      {/* ========================================= */}
      {mode === 'matrix' && selectedClass && (
        <div className="animate-slide-up space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row items-end gap-4 shadow-sm">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Exam Term</label>
              <select 
                value={selectedTerm} 
                onChange={(e) => setSelectedTerm(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-slate-700 font-bold"
              >
                <option value="">-- Choose Examination Term --</option>
                {examTerms.map((term, i) => <option key={i} value={term}>{term}</option>)}
              </select>
            </div>
            <button 
              onClick={handleFetchMatrix}
              disabled={dataLoading || !selectedTerm}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-colors w-full md:w-auto disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {dataLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Load Matrix'}
            </button>
          </div>

          {matrixData.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <FiLayout className="text-indigo-600"/> Class Matrix: {selectedTerm}
                </h3>
                <button onClick={exportMatrixCSV} className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                  <FiDownload size={14} /> Download Excel
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-indigo-600 text-white text-[10px] uppercase tracking-wider">
                      <th className="p-4 font-black whitespace-nowrap border-r border-indigo-500">Roll No</th>
                      <th className="p-4 font-black whitespace-nowrap border-r border-indigo-500">Student Name</th>
                      {subjects.map(s => (
                        <th key={s.id} className="p-4 font-black whitespace-nowrap text-center border-r border-indigo-500">{s.name} ({s.maxMarks})</th>
                      ))}
                      <th className="p-4 font-black whitespace-nowrap text-center bg-indigo-700">Total Obtd</th>
                      <th className="p-4 font-black whitespace-nowrap text-center bg-indigo-700">Total Max</th>
                      <th className="p-4 font-black whitespace-nowrap text-center bg-indigo-800">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-slate-600">
                    {matrixData.map((row, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800 border-r border-slate-100">{row.rollno}</td>
                        <td className="p-4 border-r border-slate-100 whitespace-nowrap">{row.name}</td>
                        {subjects.map(s => (
                          <td key={s.id} className="p-4 text-center border-r border-slate-100 font-bold text-indigo-600">
                            {row.subjectMarks[s.name]}
                          </td>
                        ))}
                        <td className="p-4 text-center font-black text-slate-800 bg-slate-50">{row.totalObtained}</td>
                        <td className="p-4 text-center text-slate-500 bg-slate-50">{row.totalMax}</td>
                        <td className={`p-4 text-center font-black bg-slate-100 ${parseFloat(row.percentage) >= 50 ? 'text-teal-600' : 'text-rose-600'}`}>
                          {row.percentage}%
                        </td>
                      </tr>
                    ))}
                    
                    {/* BOTTOM STATS ROWS */}
                    <tr className="bg-amber-50/50 border-t-2 border-amber-200">
                      <td colSpan={2} className="p-4 font-black text-right uppercase tracking-wider text-[10px] text-amber-700 border-r border-amber-100">Subject Average</td>
                      {subjects.map(s => (
                        <td key={s.id} className="p-4 text-center font-black text-amber-700 border-r border-amber-100">{subjectStats[s.name]?.average || '-'}</td>
                      ))}
                      <td colSpan={2} className="p-4 text-right font-black uppercase text-[10px] text-amber-700 tracking-wider">Class Overall % <FiChevronRight className="inline"/></td>
                      <td className="p-4 text-center font-black text-lg text-amber-600 bg-amber-100">{overallPercentage}%</td>
                    </tr>
                    <tr className="bg-teal-50/30">
                      <td colSpan={2} className="p-4 font-black text-right uppercase tracking-wider text-[10px] text-teal-700 border-r border-teal-50">Highest Score</td>
                      {subjects.map(s => (
                        <td key={s.id} className="p-4 text-center font-black text-teal-700 border-r border-teal-50">{subjectStats[s.name]?.highest || '-'}</td>
                      ))}
                      <td colSpan={3} className="bg-slate-50"></td>
                    </tr>
                    <tr className="bg-rose-50/30">
                      <td colSpan={2} className="p-4 font-black text-right uppercase tracking-wider text-[10px] text-rose-700 border-r border-rose-50">Lowest Score</td>
                      {subjects.map(s => (
                        <td key={s.id} className="p-4 text-center font-black text-rose-700 border-r border-rose-50">{subjectStats[s.name]?.lowest || '-'}</td>
                      ))}
                      <td colSpan={3} className="bg-slate-50"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* MODE 2: STUDENT LOOKUP VIEW               */}
      {/* ========================================= */}
      {mode === 'student' && selectedClass && (
        <div className="animate-slide-up space-y-6">
          <form onSubmit={handleStudentSearch} className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row items-end gap-4 shadow-sm">
            <div className="flex-1 w-full relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Identifier</label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Enter Roll Number or Admission Number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-teal-500 text-slate-700 font-bold"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={dataLoading || !identifier}
              className="px-8 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-600/30 transition-colors w-full md:w-auto disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {dataLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Search Student'}
            </button>
          </form>

          {/* 🚨 FIXED: Transformed the plain dark header into a professional Glassmorphic gradient card */}
          {studentInfo && Object.keys(studentHistory).length > 0 && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg shadow-teal-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-4xl font-black text-white shadow-inner">
                    {studentInfo.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-1.5 tracking-tight">{studentInfo.name}</h2>
                    <div className="flex gap-4 text-sm font-medium text-teal-50">
                      <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-lg border border-white/10">
                        AdNo: <span className="text-white font-bold">{studentInfo.adno}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-lg border border-white/10">
                        Roll No: <span className="text-white font-bold">{studentInfo.rollno}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={exportStudentCSV} className="relative z-10 hidden md:flex text-sm font-bold text-teal-700 bg-white px-6 py-3 rounded-xl items-center gap-2 hover:bg-teal-50 transition-all shadow-sm hover:shadow-md">
                  <FiDownload size={18} /> Download Complete History
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {Object.keys(studentHistory).map((term, index) => {
                  const data = studentHistory[term];
                  const termPercentage = data.totalMax > 0 ? ((data.totalObtained / data.totalMax) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={index} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                          <FiBook className="text-teal-600"/> {term}
                        </h3>
                        <span className={`px-4 py-1.5 rounded-lg text-sm font-black border ${termPercentage >= 50 ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {termPercentage}% Overall
                        </span>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {data.results.map((r, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{r.examId?.subject || 'Unknown'}</p>
                              <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-slate-800 leading-none">{r.marksObtained}</span>
                                <span className="text-sm font-bold text-slate-400 leading-none mb-0.5">/ {r.examId?.maxMarks || 100}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-6 bg-slate-900 text-white rounded-2xl p-5 w-full md:w-max">
                           <div>
                             <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Total Marks</p>
                             <p className="text-xl font-black">{data.totalObtained} <span className="text-sm text-slate-500">/ {data.totalMax}</span></p>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {studentInfo && Object.keys(studentHistory).length === 0 && !dataLoading && (
            <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-3xl max-w-lg mx-auto">
               <FiAlertCircle size={40} className="text-slate-400 mx-auto mb-3" />
               <h3 className="font-bold text-slate-800">Student Found, But No Results</h3>
               <p className="text-sm font-medium text-slate-500 mt-1">Student <b>{studentInfo.name}</b> exists, but there are no exam marks recorded for them yet.</p>
             </div>
          )}

          {studentInfo === null && identifier && !dataLoading && (
             <div className="text-center py-20 bg-rose-50 border border-rose-100 rounded-3xl max-w-lg mx-auto">
               <FiAlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
               <h3 className="font-bold text-rose-800">Student Not Found</h3>
               <p className="text-sm font-medium text-rose-600/70 mt-1">No student matches that identifier in Class {selectedClass}.</p>
             </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MyClassResults;