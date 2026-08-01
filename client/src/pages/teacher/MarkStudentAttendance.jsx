import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCheckSquare, FiCalendar, FiClock, FiBook, 
  FiCheckCircle, FiXCircle, FiSave, FiUsers, FiLock, FiSun, FiMoon, FiDownload, FiBarChart2
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const MarkStudentAttendance = () => {
  const { backendUrl } = useAppContext();

  const todayDateString = new Date().toISOString().split('T')[0];
  const [selectedDate] = useState(todayDateString); 
  const [dayOfWeek, setDayOfWeek] = useState('');

  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  const [session, setSession] = useState('FN'); 
  const [viewMode, setViewMode] = useState('mark'); 
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); 
  const [isEditing, setIsEditing] = useState(false); 
  
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingClass, setLoadingClass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notStartedError, setNotStartedError] = useState(''); 

  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  const getDayName = (dateString) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date(dateString).getDay()];
  };

  useEffect(() => {
    const fetchAssignedClassAndSchedules = async () => {
      setLoadingSchedules(true);
      const currentDay = getDayName(selectedDate);
      setDayOfWeek(currentDay);
      
      setSelectedSchedule(null);
      setStudents([]);
      setIsEditing(false);

      try {
        const { data } = await axios.get(`${backendUrl}/api/teacher/schedule/day`, {
          params: { day: currentDay },
          withCredentials: true
        });

        if (data.success) {
          const uniqueClasses = [];
          const map = new Map();
          
          for (const item of data.schedules) {
             const key = `${item.grade}-${item.section}`;
             if(!map.has(key)){
                 map.set(key, true);
                 uniqueClasses.push({
                     ...item,
                     subject: `Class ${item.grade} - Section ${item.section}` 
                 });
             }
          }

          let classTeacherSchedules = [];

          if (data.assignedClassTeachers && data.assignedClassTeachers.length > 0) {
             classTeacherSchedules = uniqueClasses.filter(item => {
                const itemG = String(item.grade).replace(/class/i, '').trim().toLowerCase();
                const itemS = String(item.section).trim().toLowerCase();
                
                return data.assignedClassTeachers.some(assigned => {
                    const assignedG = String(assigned.grade).replace(/class/i, '').trim().toLowerCase();
                    const assignedS = String(assigned.section).trim().toLowerCase();
                    return itemG === assignedG && itemS === assignedS;
                });
             });
          } else if (data.schedules.some(item => item.isClassTeacher)) {
             classTeacherSchedules = uniqueClasses.filter(item => {
                return data.schedules.some(s => s.grade === item.grade && s.section === item.section && s.isClassTeacher);
             });
          }

          setSchedules(classTeacherSchedules);
          if (classTeacherSchedules.length > 0) {
             setSelectedSchedule(classTeacherSchedules[0]);
          }
        }
      } catch (error) {
        toast.error("Failed to load your timetable for today.");
      } finally {
        setLoadingSchedules(false);
      }
    };

    if (selectedDate) fetchAssignedClassAndSchedules();
  }, [selectedDate, backendUrl]);

  useEffect(() => {
     if(selectedSchedule) {
         fetchClassAndAttendance(selectedSchedule, session);
     }
  }, [session]);

  const fetchClassAndAttendance = async (schedule, currentSession) => {
    setLoadingClass(true);
    setIsEditing(false);
    setNotStartedError('');
    
    // Check time constraints first
    const currentHour = new Date().getHours();
    if (currentSession === "FN" && currentHour < 8) {
       setNotStartedError("Forenoon attendance session has not started yet. It will be available from 8:00 AM.");
       setLoadingClass(false);
       return; // Stop fetching students
    }
    if (currentSession === "AN" && currentHour < 12) {
       setNotStartedError("Afternoon attendance session has not started yet. It will be available from 12:00 PM.");
       setLoadingClass(false);
       return; // Stop fetching students
    }

    const classId = `${schedule.grade.replace(/class/i, '').trim()}-${schedule.section.trim()}`;

    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        axios.get(`${backendUrl}/api/teacher/students`, {
          params: { grade: schedule.grade, section: schedule.section },
          withCredentials: true
        }),
        axios.get(`${backendUrl}/api/teacher/attendance/record`, {
          params: { classId, date: selectedDate, session: currentSession },
          withCredentials: true
        })
      ]);

      if (studentsRes.data.success) {
        const fetchedStudents = studentsRes.data.students;
        
        if (fetchedStudents.length === 0) {
          toast.error("No students found in this class.");
          setStudents([]);
          return;
        }

        setStudents(fetchedStudents);
        const existingRecord = attendanceRes.data.record;
        const newAttendanceState = {};

        if (existingRecord) {
          setIsEditing(true);
          const absentIds = existingRecord.absentees.map(id => id.toString());
          
          fetchedStudents.forEach(student => {
            newAttendanceState[student._id] = absentIds.includes(student._id.toString()) ? 'Absent' : 'Present';
          });
          toast.success(`Loaded previously saved ${currentSession} attendance!`);
        } else {
          fetchedStudents.forEach(student => {
            newAttendanceState[student._id] = 'Present';
          });
          toast.success(`Roster loaded for ${currentSession}. All set to Present.`);
        }
        
        setAttendance(newAttendanceState);
      }
    } catch (error) {
      toast.error("Failed to load class details.");
    } finally {
      setLoadingClass(false);
    }
  };

  const fetchReportData = async (schedule) => {
    setLoadingReport(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/teacher/attendance/report`, {
        params: { grade: schedule.grade, section: schedule.section },
        withCredentials: true
      });
      if(data.success) {
         setReportData(data.report);
      }
    } catch (err) {
      toast.error("Failed to load detailed report data");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setViewMode('mark');
    fetchClassAndAttendance(schedule, session);
  };

  const handleSessionChange = (newSession) => {
    setSession(newSession);
    setViewMode('mark'); // Force UI back to marking view
  };

  const toggleStudentAttendance = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(student => { updated[student._id] = status; });
    setAttendance(updated);
  };

  const submitAttendance = async () => {
    if (!selectedSchedule) return;

    const attendanceDataArray = Object.keys(attendance).map(id => ({
      studentId: id,
      status: attendance[id]
    }));

    setSaving(true);
    try {
      const payload = {
        date: selectedDate,
        grade: selectedSchedule.grade,
        section: selectedSchedule.section,
        session: session, 
        attendanceData: attendanceDataArray
      };

      const { data } = await axios.post(`${backendUrl}/api/teacher/attendance/mark`, payload, {
        withCredentials: true
      });

      if (data.success) {
        toast.success(data.message || "Attendance saved successfully!");
        setIsEditing(true);

        const absentCount = attendanceDataArray.filter(a => a.status === 'Absent').length;
        if (absentCount > 0) {
          toast.success("Preparing native WhatsApp alerts...");
          try {
            const alertRes = await axios.post(`${backendUrl}/api/teacher/attendance/send-alerts`, {
              grade: selectedSchedule.grade,
              section: selectedSchedule.section,
              date: selectedDate,
              session: session
            }, { withCredentials: true });

            if (alertRes.data.success && alertRes.data.alerts) {
              alertRes.data.alerts.forEach((alert, index) => {
                setTimeout(() => {
                  const encodedMessage = encodeURIComponent(alert.message);
                  window.location.href = `whatsapp://send?phone=${alert.phone}&text=${encodedMessage}`;
                }, index * 2000);
              });
              toast.success("Opening native WhatsApp application.");
            }
          } catch (err) {
             toast.error("Failed to fetch alert data.");
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save attendance. Ensure you are the Class Teacher.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportData.length) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Roll No,Student Name,Monthly Work Days,Monthly Present,Monthly Absent (Full),Monthly Absent (Half),Monthly %,Cumulative Work Days,Cumulative Present,Cumulative Absent (Full),Cumulative Absent (Half),Cumulative %\n";

    reportData.forEach(row => {
      csvContent += `${row.rollno},"${row.name}",${row.monthly.workingDays},${row.monthly.presentDays},${row.monthly.absentFull},${row.monthly.absentHalf},${row.monthly.percentage}%,${row.yearly.workingDays},${row.yearly.presentDays},${row.yearly.absentFull},${row.yearly.absentHalf},${row.yearly.percentage}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Class_${selectedSchedule.grade}_Sec_${selectedSchedule.section}_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'Absent').length;

  return (
    <div className="p-0 m-0 w-full animate-fade-in font-sans">
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 m-0">
            <FiBook /> Your Designated Classes
          </h3>
          
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 w-full md:w-auto relative group">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
              <FiCalendar size={18} />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FiLock size={10} /> Locked to Today
              </p>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-700">{dayOfWeek}</span>
                <input 
                  type="date" 
                  value={selectedDate} 
                  readOnly
                  title="Date is locked to today for security."
                  className="text-sm font-bold text-slate-500 outline-none bg-transparent cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>
        </div>
        
        {loadingSchedules ? (
          <div className="flex items-center gap-3 text-indigo-500 py-4">
            <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="font-bold">Loading your classes...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <FiCheckCircle size={32} className="mx-auto text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-600 text-lg">No Assigned Classes Found</h4>
            <p className="text-slate-400 font-medium text-sm">You are not designated as a class teacher today.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
            {schedules.map((schedule) => {
              const isActive = selectedSchedule?._id === schedule._id;
              return (
                <div 
                  key={schedule._id}
                  onClick={() => handleScheduleClick(schedule)}
                  className={`min-w-[240px] snap-start cursor-pointer transition-all duration-300 rounded-2xl p-5 border-2 relative overflow-hidden group ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/30 text-white transform scale-[1.02]' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'}`}>
                      Class Teacher
                    </span>
                  </div>
                  <h4 className="font-black text-xl leading-tight mb-1 relative z-10">{schedule.subject}</h4>
                  
                  <FiUsers className={`absolute -right-4 -bottom-4 text-6xl transform rotate-12 opacity-10 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-indigo-900'}`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Roster / Mark Section */}
      {selectedSchedule && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
          
          {/* Top Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
            <button
              onClick={() => setViewMode('mark')}
              className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-colors ${viewMode === 'mark' ? 'bg-white text-indigo-600 shadow-sm border-t border-l border-r border-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <div className="flex items-center gap-2"><FiCheckSquare /> Mark Session</div>
            </button>
            <button
              onClick={() => { setViewMode('report'); fetchReportData(selectedSchedule); }}
              className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-colors ${viewMode === 'report' ? 'bg-white text-indigo-600 shadow-sm border-t border-l border-r border-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <div className="flex items-center gap-2"><FiBarChart2 /> Detailed Report</div>
            </button>
          </div>

          {viewMode === 'mark' ? (
            <>
              {/* Session Toggle & Header */}
              <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <button 
                       onClick={() => handleSessionChange('FN')}
                       className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${session === 'FN' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                       <FiSun /> Forenoon
                    </button>
                    <button 
                       onClick={() => handleSessionChange('AN')}
                       className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${session === 'AN' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                       <FiMoon /> Afternoon
                    </button>

                    {isEditing && !notStartedError && !loadingClass && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 ml-4">
                        <FiSave size={12} /> Saved Data Loaded
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                    <FiUsers className="text-indigo-500" /> {selectedSchedule.subject}
                    <span className="mx-2 text-slate-300">|</span> 
                    {students.length} Students Total
                  </p>
                </div>
                
                {/* Stats */}
                {!notStartedError && !loadingClass && students.length > 0 && (
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-full md:w-auto">
                    <div className="px-6 py-2 text-center border-r border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Present</p>
                      <p className="text-2xl font-black text-teal-600 leading-none mt-1">{presentCount}</p>
                    </div>
                    <div className="px-6 py-2 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Absent</p>
                      <p className="text-2xl font-black text-rose-600 leading-none mt-1">{absentCount}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              {loadingClass ? (
                <div className="p-16 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="font-bold text-slate-500">Loading class roster...</p>
                </div>
              ) : notStartedError ? (
                <div className="p-16 text-center bg-rose-50/50">
                  <FiClock className="mx-auto text-rose-300 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-rose-800 mb-2">Session Not Active</h3>
                  <p className="font-medium text-rose-600 max-w-md mx-auto">{notStartedError}</p>
                </div>
              ) : students.length > 0 ? (
                <>
                  {/* Mark All Buttons */}
                  <div className="px-5 py-3 border-b border-slate-100 flex gap-3 bg-white">
                    <button 
                      onClick={() => markAll('Present')}
                      className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-lg transition-colors border border-teal-200"
                    >
                      Mark All Present
                    </button>
                    <button 
                      onClick={() => markAll('Absent')}
                      className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors border border-rose-200"
                    >
                      Mark All Absent
                    </button>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse relative">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-100/90 backdrop-blur-sm border-b border-slate-200">
                          <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider w-24">Roll No</th>
                          <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Student Details</th>
                          <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right pr-8">Status Toggle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.map(student => (
                          <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 font-black text-slate-700">{student.rollNumber || student.rollno || '--'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 block leading-tight">{student.name}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                                <button
                                  onClick={() => toggleStudentAttendance(student._id, 'Present')}
                                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    attendance[student._id] === 'Present' 
                                      ? 'bg-white text-teal-600 shadow-sm border border-teal-100' 
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  <FiCheckCircle size={16} /> Present
                                </button>
                                <button
                                  onClick={() => toggleStudentAttendance(student._id, 'Absent')}
                                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    attendance[student._id] === 'Absent' 
                                      ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-200' 
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  <FiXCircle size={16} /> Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer / Submit */}
                  <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <FiLock size={14} className="text-slate-400" /> Records will be saved for today's {session === 'FN' ? 'Forenoon' : 'Afternoon'} session.
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={submitAttendance}
                        disabled={saving}
                        className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 ${
                          isEditing 
                            ? 'bg-navy hover:bg-navy-light text-white shadow-navy/30' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                        }`}
                      >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />}
                        {saving ? 'Processing...' : isEditing ? 'Update Records' : 'Save Final Attendance'}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            // Report View
            <div className="p-0 animate-fade-in">
               <div className="p-5 flex flex-col md:flex-row justify-between items-center bg-white border-b border-slate-200 gap-4">
                 <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Class Attendance Master Report</h3>
                 <button onClick={handleDownloadReport} className="text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors border border-indigo-200 flex items-center gap-2 w-full md:w-auto justify-center">
                   <FiDownload size={14}/> Download CSV Receipt
                 </button>
               </div>
               
               <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                  {loadingReport ? (
                     <div className="p-16 text-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-slate-500 font-bold">Compiling Reports...</p>
                     </div>
                  ) : reportData.length === 0 ? (
                     <div className="p-16 text-center text-slate-500 font-medium">No active student records found for reporting.</div>
                  ) : (
                    <table className="w-full text-left border-collapse relative min-w-[900px]">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="bg-slate-100/90 backdrop-blur-sm border-b border-slate-200">
                          <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider w-20 border-r border-slate-200">Roll No</th>
                          <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Student Name</th>
                          <th colSpan="5" className="p-4 text-[10px] font-black text-indigo-600 uppercase tracking-wider text-center bg-indigo-50/50 border-r border-slate-200">Monthly Record</th>
                          <th colSpan="5" className="p-4 text-[10px] font-black text-teal-600 uppercase tracking-wider text-center bg-teal-50/50">Cumulative (Yearly)</th>
                        </tr>
                        <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                          <th className="p-2 border-r border-slate-200"></th>
                          <th className="p-2 border-r border-slate-200"></th>
                          <th className="p-2 text-[10px] font-bold text-slate-600 text-center bg-indigo-50/30">Work Days</th>
                          <th className="p-2 text-[10px] font-bold text-emerald-600 text-center bg-indigo-50/30">Present</th>
                          <th className="p-2 text-[10px] font-bold text-rose-500 text-center bg-indigo-50/30">Abs (F)</th>
                          <th className="p-2 text-[10px] font-bold text-orange-500 text-center bg-indigo-50/30">Abs (H)</th>
                          <th className="p-2 text-[10px] font-black text-indigo-700 text-center bg-indigo-50/50 border-r border-slate-200">%</th>

                          <th className="p-2 text-[10px] font-bold text-slate-600 text-center bg-teal-50/30">Work Days</th>
                          <th className="p-2 text-[10px] font-bold text-emerald-600 text-center bg-teal-50/30">Present</th>
                          <th className="p-2 text-[10px] font-bold text-rose-500 text-center bg-teal-50/30">Abs (F)</th>
                          <th className="p-2 text-[10px] font-bold text-orange-500 text-center bg-teal-50/30">Abs (H)</th>
                          <th className="p-2 text-[10px] font-black text-teal-700 text-center bg-teal-50/50">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {reportData.map(student => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                             <td className="p-3 font-black text-sm text-slate-700 border-r border-slate-100">{student.rollno || '--'}</td>
                             <td className="p-3 font-bold text-sm text-slate-800 border-r border-slate-100">{student.name}</td>
                             
                             <td className="p-3 text-center text-sm font-medium border-r border-slate-100">{student.monthly.workingDays}</td>
                             <td className="p-3 text-center text-sm font-bold text-emerald-600 border-r border-slate-100">{student.monthly.presentDays}</td>
                             <td className="p-3 text-center text-sm font-bold text-rose-500 border-r border-slate-100">{student.monthly.absentFull}</td>
                             <td className="p-3 text-center text-sm font-bold text-orange-500 border-r border-slate-200">{student.monthly.absentHalf}</td>
                             <td className="p-3 text-center text-sm font-black text-indigo-600 border-r border-slate-200 bg-indigo-50/10">{student.monthly.percentage}%</td>

                             <td className="p-3 text-center text-sm font-medium border-r border-slate-100">{student.yearly.workingDays}</td>
                             <td className="p-3 text-center text-sm font-bold text-emerald-600 border-r border-slate-100">{student.yearly.presentDays}</td>
                             <td className="p-3 text-center text-sm font-bold text-rose-500 border-r border-slate-100">{student.yearly.absentFull}</td>
                             <td className="p-3 text-center text-sm font-bold text-orange-500 border-r border-slate-200">{student.yearly.absentHalf}</td>
                             <td className="p-3 text-center text-sm font-black text-teal-600 bg-teal-50/10">{student.yearly.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
               </div>
            </div>
          )}
          
        </div>
      )}

    </div>
  );
};

export default MarkStudentAttendance;