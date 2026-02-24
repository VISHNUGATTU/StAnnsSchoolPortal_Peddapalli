import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, AlertTriangle, TrendingUp, Filter, CheckCircle, BookOpen, Mail 
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa'; 
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const FacultyDashboard = () => {
  const { user } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false); // Bulk email state
  const [data, setData] = useState(null);
  
  // --- MASTER LIST & FILTERS ---
  const [allClasses, setAllClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const COLORS = ['#10B981', '#F43F5E']; 

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await axios.get('/api/faculty/classes'); 
        if (data.success) setAllClasses(data.classes);
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    };
    fetchClasses();
  }, []);

  // --- CASCADING DROPDOWNS ---
  const availableSubjects = useMemo(() => [...new Set(allClasses.map(c => c.subject))], [allClasses]);

  const availableYears = useMemo(() => {
    if (!selectedSubject) return [];
    return [...new Set(allClasses.filter(c => c.subject === selectedSubject).map(c => c.year))].sort();
  }, [allClasses, selectedSubject]);

  const availableBranches = useMemo(() => {
    if (!selectedSubject || !selectedYear) return [];
    return [...new Set(allClasses.filter(c => c.subject === selectedSubject && c.year === Number(selectedYear)).map(c => c.branch))].sort();
  }, [allClasses, selectedSubject, selectedYear]);

  const availableSections = useMemo(() => {
    if (!selectedSubject || !selectedYear || !selectedBranch) return [];
    return [...new Set(allClasses.filter(c => c.subject === selectedSubject && c.year === Number(selectedYear) && c.branch === selectedBranch).map(c => c.section))].sort();
  }, [allClasses, selectedSubject, selectedYear, selectedBranch]);


  // --- FETCH ANALYTICS ---
  const fetchAnalytics = async () => {
    if(!selectedSubject || !selectedYear || !selectedBranch || !selectedSection) {
      return toast.error("Please select all fields");
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/faculty/analytics', {
        params: { year: selectedYear, branch: selectedBranch, section: selectedSection, subject: selectedSubject }
      });

      if (response.data.success) {
        setData(response.data);
        if(response.data.stats.totalStudents === 0) toast("No students found.");
        else toast.success("Report loaded!");
      }
    } catch (err) {
      toast.error("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  // --- BULK EMAIL AUTOMATION ---
  const handleBulkEmail = async () => {
    if (!data?.defaulters?.length) return;

    setIsNotifying(true);
    const notificationToast = toast.loading("Sending automated emails to defaulters...");

    try {
      const response = await axios.post('/api/faculty/notify-email', {
        subject: selectedSubject,
        defaulters: data.defaulters
      });

      if (response.data.success) {
        toast.success(`Successfully emailed ${data.defaulters.length} students!`, { id: notificationToast });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send bulk emails.", { id: notificationToast });
    } finally {
      setIsNotifying(false);
    }
  };

  // --- MANUAL WHATSAPP REDIRECT ---
  const sendWhatsAppWarning = (student) => {
    if (!student.phno) return toast.error("No phone number found");
    const message = `Hello ${student.name},\n\nYour attendance in *${selectedSubject}* is critically low at *${student.percentage}%* (${student.classesAttended}/${student.totalClasses} classes). Please meet me immediately.`;
    window.open(`https://wa.me/${student.phno}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const chartData = data ? [
    { name: 'Safe (>75%)', value: data.stats.totalStudents - data.stats.defaulterCount },
    { name: 'Critical (<75%)', value: data.stats.defaulterCount }
  ] : [];

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 text-slate-800 font-sans animate-fade-in-up">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Subject Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Select a subject configuration to view specific class attendance reports.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            {/* SUBJECT */}
            <div className="relative">
               <BookOpen size={16} className="absolute left-3 top-3 text-indigo-500" />
               <select 
                  value={selectedSubject} 
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedYear(''); setSelectedBranch(''); setSelectedSection('');
                  }}
                  className="bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-sm rounded-xl py-2.5 pl-10 pr-4 font-bold min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-colors"
               >
                  <option value="" disabled>Select Subject</option>
                  {availableSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
               </select>
            </div>

            {/* YEAR */}
            <select 
              value={selectedYear} 
              onChange={(e) => { setSelectedYear(e.target.value); setSelectedBranch(''); setSelectedSection(''); }}
              disabled={!selectedSubject}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors min-w-[130px]"
            >
              <option value="">Select Year</option>
              {availableYears.map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>

            {/* BRANCH */}
            <select 
              value={selectedBranch} 
              onChange={(e) => { setSelectedBranch(e.target.value); setSelectedSection(''); }}
              disabled={!selectedYear}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors min-w-[120px]"
            >
              <option value="">Branch</option>
              {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* SECTION */}
            <select 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedBranch}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors min-w-[120px]"
            >
              <option value="">Section</option>
              {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button 
              onClick={fetchAnalytics}
              disabled={loading || !selectedSection}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 ml-auto active:scale-95"
            >
              {loading ? <span className="animate-pulse">Loading Report...</span> : "Generate Report"}
            </button>
          </div>
        </div>

        {/* RESULTS AREA */}
        {data ? (
          <div className="space-y-8 animate-in fade-in duration-500">
             
             {/* 1. STATS CARDS */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Students</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{data.stats.totalStudents}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Subject Average</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{data.stats.classAverage}%</h3>
                </div>
              </div>
              <div className="bg-rose-50/40 p-6 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4">
                <div className="p-3.5 bg-rose-100 text-rose-600 rounded-xl"><AlertTriangle size={24} /></div>
                <div>
                  <p className="text-sm text-rose-500 font-bold uppercase tracking-wider">Defaulters</p>
                  <h3 className="text-2xl font-extrabold text-rose-700 mt-1">{data.stats.defaulterCount}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* 2. PIE CHART */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm xl:col-span-1 flex flex-col items-center">
                <h3 className="text-lg font-bold text-slate-800 mb-2 w-full text-left">Attendance Health</h3>
                <div className="h-[280px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={chartData} 
                        cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={false}
                      >
                        {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. DEFAULTERS LIST WITH AUTOMATIC BULK EMAIL */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm xl:col-span-2 overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-rose-500" /> Detained List
                    </h3>
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                      {data.defaulters.length} Students
                    </span>
                  </div>

                  {/* 🚀 BULK EMAIL BUTTON */}
                  {data.defaulters.length > 0 && (
                    <button 
                      onClick={handleBulkEmail}
                      disabled={isNotifying}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50"
                    >
                      {isNotifying ? (
                        <span className="animate-pulse">Sending Emails...</span>
                      ) : (
                        <><Mail size={16} /> Auto-Email All</>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                  {data.defaulters.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 min-h-[300px]">
                      <CheckCircle size={56} className="text-emerald-200 mb-4" />
                      <p className="font-bold text-lg text-slate-500">No Defaulters Found!</p>
                      <p className="text-sm">Attendance looks great for this class.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="text-xs uppercase text-slate-400 sticky top-0 bg-white shadow-sm z-10 font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Roll No</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Stats</th>
                          <th className="px-6 py-4">Percentage</th>
                          <th className="px-6 py-4 text-center">Manual Ping</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.defaulters.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors bg-white">
                            <td className="px-6 py-4 text-sm font-bold font-mono text-slate-600 uppercase">
                              {student.rollno}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-800">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                              {student.classesAttended} / {student.totalClasses}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                {student.percentage}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center flex justify-center">
                              {/* Keep Manual WhatsApp just in case */}
                              <button 
                                onClick={() => sendWhatsAppWarning(student)} 
                                title="Send individual WhatsApp message manually"
                                className="flex items-center justify-center text-emerald-600 hover:text-white border border-emerald-200 bg-emerald-50 hover:bg-emerald-500 p-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                              >
                                <FaWhatsapp size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <Filter size={56} className="mb-4 text-indigo-100" />
            <h3 className="text-xl font-bold text-slate-700">Configure Subject Filters</h3>
            <p className="text-sm text-center max-w-md mt-2 leading-relaxed">
              Start by selecting a Subject above. The valid Year, Branch, and Section configurations will cascade automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;