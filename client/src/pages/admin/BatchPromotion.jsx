import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiFastForward, FiArrowRight, FiUsers, FiAlertTriangle, 
  FiCheckSquare, FiSquare, FiSave, FiLock, FiX, FiCalendar
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const BatchPromotion = () => {
  const { backendUrl } = useAppContext();
  
  const gradeSequence = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Alumni"];
  const sectionOptions = ["A", "B", "C", "D"];

  // Configuration State
  const [source, setSource] = useState({ grade: '1', section: 'A' });
  const [target, setTarget] = useState({ grade: '2', section: 'A' });
  
  // Settings State
  const [academicYear, setAcademicYear] = useState({ start: '', end: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  // Data State
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fetched, setFetched] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  // 🚨 Fetch global academic settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/settings/academic-year`, { withCredentials: true });
        if (data.success && data.settings) {
          setAcademicYear({
            start: data.settings.academicYearStart ? new Date(data.settings.academicYearStart).toISOString().split('T')[0] : '',
            end: data.settings.academicYearEnd ? new Date(data.settings.academicYearEnd).toISOString().split('T')[0] : ''
          });
        }
      } catch (error) {
        toast.error("Failed to load academic year settings.");
      }
    };
    fetchSettings();
  }, [backendUrl]);

  // 🚨 Handle Settings Update
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!academicYear.start || !academicYear.end) return toast.error("Both dates are required.");
    setSavingSettings(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/settings/academic-year`, academicYear, { withCredentials: true });
      if (data.success) {
        toast.success(data.message || "Academic year limits updated globally.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update academic year.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSourceChange = (e) => {
    const { name, value } = e.target;
    setSource(prev => ({ ...prev, [name]: value }));
    setFetched(false); 

    if (name === 'grade') {
      const currentIndex = gradeSequence.indexOf(value);
      const nextGrade = currentIndex < gradeSequence.length - 1 ? gradeSequence[currentIndex + 1] : "Alumni";
      setTarget(prev => ({ ...prev, grade: nextGrade }));
    }
  };

  const handleTargetChange = (e) => {
    setTarget({ ...target, [e.target.name]: e.target.value });
  };

  const handleFetch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/students/all`, {
        withCredentials: true
      });

      if (data.success) {
        const sourceStudents = data.students.filter(
          s => s.grade === source.grade && s.section === source.section
        );
        
        setStudents(sourceStudents);
        setSelectedIds(sourceStudents.map(s => s._id));
        setFetched(true);
        
        if (sourceStudents.length === 0) {
          toast.success(`No students found in Class ${source.grade}-${source.section}`);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]); 
    } else {
      setSelectedIds(students.map(s => s._id)); 
    }
  };

  const handleOpenAuthModal = () => {
    if (selectedIds.length === 0) {
      return toast.error("Please select at least one student to transfer.");
    }
    setShowModal(true);
  };

  const handleVerifyAndPromote = async (e) => {
    e.preventDefault();
    if (!adminPassword) return toast.error("Master password is required.");

    setVerifying(true);
    try {
      const verifyRes = await axios.post(`${backendUrl}/api/admin/verify-batch-password`, { 
        password: adminPassword 
      }, { withCredentials: true });

      if (verifyRes.data.success) {
        const payload = {
          studentIds: selectedIds,
          targetGrade: target.grade,
          targetSection: target.section
        };

        const { data } = await axios.post(`${backendUrl}/api/admin/students/promote`, payload, {
          withCredentials: true
        });

        if (data.success) {
          toast.success(data.message || `Successfully transferred ${data.summary?.promotedCount || selectedIds.length} students!`);
          
          if (data.summary && data.summary.blockedCount > 0) {
            toast.error(`${data.summary.blockedCount} students were blocked due to pending fees or detention status.`, { duration: 6000 });
          }

          setFetched(false);
          setStudents([]);
          setSelectedIds([]);
          setShowModal(false);
          setAdminPassword('');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification or transfer failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans relative">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
          <FiFastForward className="text-amber-500" /> Batch Transfer & Promotion
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Bulk upgrade or reassign students to different academic levels.</p>
      </div>

      {/* 🚨 NEW MODULE: Academic Year Configuration Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-navy flex items-center gap-2 mb-1">
            <FiCalendar className="text-indigo-500" /> Global Academic Year Configuration
          </h3>
          <p className="text-xs font-medium text-slate-500 max-w-sm">
            Set the operational boundaries for the current academic year. These dates govern system-wide calculations, attendance limits, and term validations.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
              <input 
                type="date" 
                required
                value={academicYear.start}
                onChange={(e) => setAcademicYear({...academicYear, start: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 w-full"
              />
            </div>
            <div className="hidden md:block w-4 border-t-2 border-dashed border-slate-300 mt-4"></div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">End Date</label>
              <input 
                type="date" 
                required
                value={academicYear.end}
                onChange={(e) => setAcademicYear({...academicYear, end: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 w-full"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={savingSettings}
            className="mt-4 md:mt-5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-70 flex items-center gap-2 w-full md:w-auto justify-center shrink-0"
          >
            {savingSettings ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />} 
            Save Dates
          </button>
        </form>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 mb-8">
        
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <FiAlertTriangle className="text-amber-500 mt-1 shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-amber-800">Caution: Bulk Academic Record Update</h3>
            <p className="text-sm text-amber-700/80 mt-1 font-medium">
              This action permanently updates the Grade and Section for selected students, resets their attendance to 0, and clears their fee structures for the new academic year. Students with pending due balances will be automatically blocked from transferring.
            </p>
          </div>
        </div>

        <form onSubmit={handleFetch} className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Transfer From (Current)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                <select name="grade" value={source.grade} onChange={handleSourceChange} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 text-navy font-bold">
                  {gradeSequence.filter(g => g !== 'Alumni').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                <select name="section" value={source.section} onChange={handleSourceChange} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 text-navy font-bold">
                  {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex w-12 h-12 bg-amber-100 rounded-full items-center justify-center text-amber-600 shrink-0 shadow-inner">
            <FiArrowRight size={24} />
          </div>

          <div className="flex-1 w-full bg-amber-50/50 border border-amber-200 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4">Transfer To (Destination)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                  <FiLock size={10} /> Assigned Grade
                </label>
                <div 
                  className="w-full bg-amber-100/50 border border-amber-200/60 rounded-xl px-3 py-2 text-amber-800 font-bold cursor-not-allowed flex items-center shadow-inner"
                  title="Target grade is mathematically locked to exactly 1 level above the source."
                >
                  {target.grade}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Section</label>
                <select name="section" value={target.section} onChange={handleTargetChange} className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 text-navy font-bold">
                  {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="lg:w-48 w-full shrink-0">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-full min-h-[100px] rounded-2xl font-bold text-white bg-navy hover:bg-navy-light shadow-lg shadow-navy/20 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiUsers size={24} />}
              <span>Fetch Class</span>
            </button>
          </div>
        </form>
      </div>

      {/* Roster & Execute Panel */}
      {fetched && students.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
          <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                Review Student Roster
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Uncheck students who are staying back or have pending constraints.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-500">
                Selected: <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{selectedIds.length} / {students.length}</span>
              </span>
              <button 
                onClick={handleOpenAuthModal}
                disabled={selectedIds.length === 0}
                className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2 shadow-md shadow-amber-500/30 disabled:opacity-50"
              >
                <FiSave /> Execute Transfer
              </button>
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="p-4 w-16">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-amber-500 transition-colors">
                      {selectedIds.length === students.length ? <FiCheckSquare size={20} className="text-amber-500" /> : <FiSquare size={20} />}
                    </button>
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll No</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Class</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(student => {
                  const isSelected = selectedIds.includes(student._id);
                  return (
                    <tr 
                      key={student._id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${!isSelected ? 'opacity-50 bg-slate-50' : ''}`}
                      onClick={() => toggleSelection(student._id)}
                    >
                      <td className="p-4">
                        {isSelected ? <FiCheckSquare size={20} className="text-amber-500" /> : <FiSquare size={20} className="text-slate-300" />}
                      </td>
                      <td className="p-4 font-bold text-navy">{student.rollno}</td>
                      <td className="p-4 font-bold text-navy">{student.name}</td>
                      <td className="p-4 text-sm text-slate-500 font-medium">{student.grade}-{student.section}</td>
                      <td className="p-4">
                        {isSelected ? (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Transferring</span>
                        ) : (
                          <span className="text-xs font-bold bg-slate-200 text-slate-500 px-3 py-1 rounded-full">Hold Back</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-200">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-navy flex items-center gap-2">
                <FiLock className="text-indigo-500" /> Admin Authentication Required
              </h3>
              <button 
                onClick={() => { setShowModal(false); setAdminPassword(''); }}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleVerifyAndPromote} className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                  <FiAlertTriangle size={32} />
                </div>
                <h4 className="text-lg font-black text-navy">Confirm Transfer</h4>
                <p className="text-sm text-slate-500 font-medium">
                  You are about to move <span className="font-bold text-navy">{selectedIds.length}</span> students from <span className="font-bold text-navy">{source.grade}-{source.section}</span> to <span className="font-bold text-amber-600">{target.grade}-{target.section}</span>.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Master Password</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password to confirm"
                  autoFocus
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-bold text-center tracking-widest"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => { setShowModal(false); setAdminPassword(''); }}
                  className="py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={verifying}
                  className="py-3 font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {verifying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiLock />}
                  {verifying ? 'Verifying...' : 'Verify & Execute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchPromotion;