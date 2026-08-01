import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiSave, FiAward, 
  FiBookOpen, FiUser
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const UploadMarks = () => {
  const { backendUrl } = useAppContext();

  const [config, setConfig] = useState({
    grade: '',
    section: '',
    examId: '',
    maxMarks: 100 
  });

  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [marksData, setMarksData] = useState({}); 
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingMarks, setFetchingMarks] = useState(false);
  const [fetched, setFetched] = useState(false);

  const grades = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C", "D"];

  const handleConfigChange = async (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
    
    if (name === 'grade' || name === 'section') {
      setFetched(false);
      setExams([]);
      setConfig(prev => ({ ...prev, examId: '' }));
    }

    if (name === 'examId' && value) {
      const selectedExam = exams.find(ex => ex._id === value);
      if (selectedExam && selectedExam.maxMarks) {
        setConfig(prev => ({ ...prev, maxMarks: selectedExam.maxMarks }));
      }

      try {
        setFetchingMarks(true);
        const { data } = await axios.get(`${backendUrl}/api/teacher/results/exam/${value}`, { 
          withCredentials: true 
        });

        if (data.success && data.results.length > 0) {
          const existingMarks = {};
          data.results.forEach(r => {
            existingMarks[r.studentId] = { marksObtained: r.marksObtained, remarks: r.remarks || '' };
          });
          
          setMarksData(prev => {
            const updated = { ...prev };
            students.forEach(s => {
              if (existingMarks[s._id]) {
                updated[s._id] = existingMarks[s._id];
              } else {
                updated[s._id] = { marksObtained: '', remarks: '' };
              }
            });
            return updated;
          });
          toast.success("Loaded previously saved marks!");
        } else {
          const blankMarks = {};
          students.forEach(s => { blankMarks[s._id] = { marksObtained: '', remarks: '' }; });
          setMarksData(blankMarks);
        }
      } catch (err) {
        toast.error("Could not fetch existing marks.");
      } finally {
        setFetchingMarks(false);
      }
    }
  };

  const fetchClassData = async (e) => {
    e.preventDefault();
    if (!config.grade || !config.section) return toast.error("Please select both Grade and Section.");

    setLoading(true);
    try {
      const [studentsRes, examsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/teacher/students`, {
          params: { grade: config.grade, section: config.section },
          withCredentials: true
        }),
        axios.get(`${backendUrl}/api/teacher/exams`, {
          params: { grade: config.grade, section: config.section },
          withCredentials: true
        })
      ]);

      if (studentsRes.data.success && examsRes.data.success) {
        if (studentsRes.data.students.length === 0) {
          toast.error("No students found for this class.");
          setStudents([]);
        } else {
          setStudents(studentsRes.data.students);
          setExams(examsRes.data.exams);
          
          const initialMarks = {};
          studentsRes.data.students.forEach(student => {
            initialMarks[student._id] = { marksObtained: '', remarks: '' };
          });
          setMarksData(initialMarks);
          setFetched(true);
          
          if (examsRes.data.exams.length === 0) {
            toast.success("Roster loaded, but no exams are scheduled for subjects you teach.", { duration: 4000 });
          } else {
            toast.success("Class roster and exams loaded.");
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch class data.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    if (field === 'marksObtained') {
      const numValue = Number(value);
      if (numValue > Number(config.maxMarks)) {
        return toast.error(`Marks cannot exceed ${config.maxMarks}`);
      }
      if (numValue < 0) return; 
    }

    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const submitMarks = async () => {
    if (!config.examId) return toast.error("Please select an Exam.");

    const resultsPayload = students.map(student => ({
      studentId: student._id,
      marksObtained: marksData[student._id].marksObtained === '' ? 0 : Number(marksData[student._id].marksObtained),
      remarks: marksData[student._id].remarks
    }));

    setSaving(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/teacher/results/upload`, {
        examId: config.examId,
        maxMarks: Number(config.maxMarks),
        results: resultsPayload
      }, {
        withCredentials: true
      });

      if (data.success) {
        toast.success("Marks saved successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload marks.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/40 mb-8 mt-2">
        <form onSubmit={fetchClassData} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Grade</label>
            <select name="grade" value={config.grade} onChange={handleConfigChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-slate-700 font-bold">
              <option value="">Select Class</option>
              {grades.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section</label>
            <select name="section" value={config.section} onChange={handleConfigChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-slate-700 font-bold">
              <option value="">Select Section</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSearch />}
            Fetch Roster & Exams
          </button>
        </form>
      </div>

      {fetched && students.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
          
          <div className="bg-indigo-50/50 border-b border-indigo-100 p-5 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="w-full lg:w-1/2">
              <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiBookOpen /> Select Examination *
              </label>
              <select 
                name="examId" 
                value={config.examId} 
                onChange={handleConfigChange} 
                className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-indigo-900 font-bold shadow-sm"
              >
                <option value="">-- Choose the exam you are grading --</option>
                {exams.map(ex => (
                  <option key={ex._id} value={ex._id}>
                    {ex.subject} ({new Date(ex.examDate).toLocaleDateString('en-GB')}) - {ex.examTerm || 'Exam'}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full lg:w-1/4">
              <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiAward /> Max Marks
              </label>
              <input 
                type="number" 
                name="maxMarks"
                value={config.maxMarks}
                readOnly
                className="w-full bg-slate-100 border border-indigo-200 rounded-xl px-4 py-3 outline-none text-indigo-900 font-bold shadow-sm cursor-not-allowed select-none"
              />
            </div>
          </div>

          {fetchingMarks ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold">Loading existing marks...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Roll No</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Marks Obtained</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Remarks (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-slate-700">
                        {student.rollNumber || student.rollno || '--'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                            <FiUser />
                          </div>
                          <div>
                            {/* 🚨 TRUNCATED ID HAS BEEN REMOVED FROM HERE */}
                            <p className="font-bold text-slate-800 leading-tight">{student.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <input 
                          type="number"
                          min="0"
                          max={config.maxMarks}
                          placeholder="0"
                          value={marksData[student._id]?.marksObtained}
                          onChange={(e) => handleMarkChange(student._id, 'marksObtained', e.target.value)}
                          className={`w-full bg-white border ${
                            marksData[student._id]?.marksObtained !== '' ? 'border-teal-300 bg-teal-50/30' : 'border-slate-200'
                          } rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all`}
                        />
                      </td>
                      <td className="p-4 text-right">
                        <input 
                          type="text"
                          placeholder="Remarks..."
                          value={marksData[student._id]?.remarks}
                          onChange={(e) => handleMarkChange(student._id, 'remarks', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 text-slate-600 text-sm font-medium"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">
              Entering marks for <span className="text-indigo-600">{students.length}</span> students.
            </p>
            <button 
              onClick={submitMarks}
              disabled={saving || !config.examId || fetchingMarks}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />}
              {saving ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default UploadMarks;