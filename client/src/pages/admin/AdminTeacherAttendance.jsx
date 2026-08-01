import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiUsers, FiCheck, FiX, FiRefreshCw, FiLock, FiSun, FiMoon, FiAlertCircle } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AdminTeacherAttendance = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [session, setSession] = useState('FN');
  const [viewMode, setViewMode] = useState('monthly');
  
  const todayISO = new Date().toISOString().split('T')[0];
  
  const [teachers, setTeachers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); 

  // 🚨 NEW: Modal state for resetting data (identical to SalaryManagement)
  const [resetModal, setResetModal] = useState({ isOpen: false, type: '', target: '', password: '', processing: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const teacherRes = await axios.get(`${backendUrl}/api/admin/teachers/all`, { withCredentials: true });
      const attendanceRes = await axios.get(`${backendUrl}/api/admin/teacher-attendance/view?date=${todayISO}&session=${session}`, { withCredentials: true });

      if (teacherRes.data.success) {
        setTeachers(teacherRes.data.teachers);
        
        const recordsMap = {};
        if (attendanceRes.data.success && attendanceRes.data.records) {
          attendanceRes.data.records.forEach(record => {
            recordsMap[record.teacherId._id || record.teacherId] = record.status;
          });
        }
        setAttendanceData(recordsMap);
      }
    } catch (error) {
      toast.error("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [backendUrl, session]);

  const handleMarkAttendance = async (teacherId, status) => {
    setSavingId(teacherId);
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/teacher-attendance/mark`, {
        teacherId,
        date: todayISO, 
        session,
        status
      }, { withCredentials: true });

      if (data.success) {
        toast.success(data.message);
        setAttendanceData(prev => ({ ...prev, [teacherId]: status }));
        
        // Refresh silently to update the right-side report block
        const teacherRes = await axios.get(`${backendUrl}/api/admin/teachers/all`, { withCredentials: true });
        if (teacherRes.data.success) setTeachers(teacherRes.data.teachers);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark attendance.");
    } finally {
      setSavingId(null);
    }
  };

  // 🚨 NEW: Handler for wiping attendance records
  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetModal.password) return toast.error("Password required");
    
    setResetModal({ ...resetModal, processing: true });
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/salaries/reset`, {
        type: resetModal.type,
        target: resetModal.target,
        password: resetModal.password
      }, { withCredentials: true });

      if (data.success) {
        toast.success(data.message);
        setResetModal({ isOpen: false, type: '', target: '', password: '', processing: false });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
      setResetModal({ ...resetModal, processing: false });
    }
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'Absent').length;

  const displayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
            <FiCheckSquare className="text-indigo-500" /> Staff Attendance
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Session-wise daily attendance and historical reporting.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-inner cursor-not-allowed">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm text-slate-500"><FiLock size={14} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Today's Date</p>
            <p className="text-navy font-bold text-sm leading-none pr-2">{displayDate}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: MARK ATTENDANCE */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
            
            <div className="bg-slate-50/80 border-b border-slate-100 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setSession('FN')} className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm transition-colors ${session === 'FN' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <FiSun size={16} /> Forenoon
                  </button>
                  <button onClick={() => setSession('AN')} className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm transition-colors border-l border-slate-200 ${session === 'AN' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <FiMoon size={16} /> Afternoon
                  </button>
                </div>
              </div>
              <button onClick={fetchData} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
                <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            <div className="bg-white border-b border-slate-100 p-4 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-md">Total: {teachers.length}</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md">Present: {presentCount}</span>
              <span className="text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-md">Absent: {absentCount}</span>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12 text-indigo-500"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div></div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold">No teachers found in the system.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {teachers.map((teacher) => (
                    <div key={teacher._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 transition-colors gap-4">
                      <div>
                        <h3 className="font-bold text-navy text-base">{teacher.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{teacher.teacherId} • {teacher.designation}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 shrink-0">
                        <button onClick={() => handleMarkAttendance(teacher._id, 'Present')} disabled={savingId === teacher._id} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${attendanceData[teacher._id] === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 hover:text-emerald-500'}`}>
                          {savingId === teacher._id && attendanceData[teacher._id] !== 'Present' ? <div className="w-3 h-3 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin"></div> : <FiCheck size={16} />} Present
                        </button>
                        <button onClick={() => handleMarkAttendance(teacher._id, 'Absent')} disabled={savingId === teacher._id} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${attendanceData[teacher._id] === 'Absent' ? 'bg-rose-100 text-rose-700' : 'text-slate-400 hover:bg-slate-100 hover:text-rose-500'}`}>
                          {savingId === teacher._id && attendanceData[teacher._id] !== 'Absent' ? <div className="w-3 h-3 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin"></div> : <FiX size={16} />} Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COL: REPORTS & RESET CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden sticky top-28">
            <div className="bg-slate-50 border-b border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-navy">Leave Summary</h2>
                {/* 🚨 NEW: Added dropdown menu to trigger reset operations */}
                <div className="relative group">
                  <button className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 hover:bg-rose-100 transition-colors">
                    Reset Data ▾
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    <button onClick={() => setResetModal({ isOpen: true, type: viewMode, target: 'teacher', password: '', processing: false })} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-600 rounded-lg">Reset Teachers</button>
                    <button onClick={() => setResetModal({ isOpen: true, type: viewMode, target: 'student', password: '', processing: false })} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-600 rounded-lg">Reset Students</button>
                  </div>
                </div>
              </div>
              
              <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden w-full">
                <button onClick={() => setViewMode('monthly')} className={`flex-1 py-2 text-xs font-bold transition-colors ${viewMode === 'monthly' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Monthly</button>
                <button onClick={() => setViewMode('cumulative')} className={`flex-1 py-2 text-xs font-bold transition-colors border-l border-slate-200 ${viewMode === 'cumulative' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Cumulative</button>
              </div>
            </div>
            
            <div className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-100 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Faculty</th>
                    <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Leaves (H / F / T)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {teachers.map(t => {
                    const stats = viewMode === 'monthly' ? (t.attendanceSummary?.monthly || {}) : (t.attendanceSummary?.yearly || {});
                    const h = stats.absentHalfDays || 0;
                    const f = stats.absentFullDays || 0;
                    const total = (h * 0.5) + f;
                    return (
                      <tr key={`report-${t._id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <p className="text-sm font-bold text-navy truncate max-w-[120px]">{t.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{t.teacherId}</p>
                        </td>
                        <td className="p-3 text-center">
                           <span className="text-sm font-bold text-slate-600">{h} / {f} / <span className={total > 0 ? "text-rose-500" : ""}>{total}</span></span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {teachers.length === 0 && !loading && (
                <div className="p-6 text-center text-sm text-slate-500 font-medium">No data available</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 🚨 NEW: Reset Confirmation Modal (Copied from SalaryManagement) */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReset} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in border border-slate-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <FiAlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-navy text-center mb-2">Reset {resetModal.target === 'teacher' ? 'Staff' : 'Student'} Data?</h2>
            <p className="text-sm text-slate-500 text-center mb-8">This will irreversibly wipe all {resetModal.type} attendance records for all {resetModal.target}s across the system.</p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><FiLock /> Master Admin Password</label>
              <input type="password" required value={resetModal.password} onChange={(e) => setResetModal({...resetModal, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 font-medium" placeholder="Authenticate to proceed..." />
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setResetModal({ isOpen: false, type: '', target: '', password: '', processing: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="submit" disabled={resetModal.processing} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-70">
                {resetModal.processing ? 'Wiping...' : 'Confirm Reset'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminTeacherAttendance;