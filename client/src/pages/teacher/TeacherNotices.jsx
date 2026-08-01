import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBell, FiSend, FiFileText, 
  FiCalendar, FiFilter, FiMessageSquare,
  FiInbox, FiDownloadCloud, FiShield
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherNotices = () => {
  const { backendUrl } = useAppContext();
  
  // Data State
  const [publishedNotices, setPublishedNotices] = useState([]);
  const [receivedNotices, setReceivedNotices] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('received'); // 'published' or 'received'
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetGrade: '',
    targetSection: ''
  });

  const grades = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C", "D", "All"];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [publishedRes, receivedRes] = await Promise.all([
        axios.get(`${backendUrl}/api/teacher/notice/all`, { withCredentials: true }),
        axios.get(`${backendUrl}/api/teacher/reports/received`, { withCredentials: true })
      ]);

      if (publishedRes.data.success) {
        setPublishedNotices(publishedRes.data.notices);
      }
      
      if (receivedRes.data.success) {
        // 🚨 THE FIX: Filter out any items that have a file attached.
        // This ensures Documents stay in the Reports Hub, and only Text Announcements show here.
        const textNoticesOnly = receivedRes.data.reports.filter(notice => !notice.file);
        setReceivedNotices(textNoticesOnly);
      }
      
    } catch (error) {
      toast.error("Failed to load notice board data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.targetGrade || !formData.targetSection) {
      return toast.error("Please fill in all the fields before publishing.");
    }

    setSubmitting(true);
    
    try {
      const { data } = await axios.post(`${backendUrl}/api/teacher/notice/create`, formData, {
        withCredentials: true
      });

      if (data.success) {
        toast.success("Notice published to students successfully!");
        setFormData({ title: '', content: '', targetGrade: '', targetSection: '' });
        
        // Refresh and switch to published tab to see the new notice
        fetchAllData(); 
        setActiveTab('published');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to publish notice.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans relative pb-10 mt-4">
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Create Notice Form */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 sticky top-6">
            <h3 className="text-xl font-serif font-bold text-slate-800 border-l-4 border-amber-500 pl-3 mb-6">
              Create Class Notice
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notice Title *</label>
                <input 
                  type="text" 
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Bring Lab Coats Tomorrow"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Class *</label>
                  <select 
                    name="targetGrade" 
                    required
                    value={formData.targetGrade}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-bold"
                  >
                    <option value="">Select</option>
                    {grades.map(g => <option key={g} value={g}>Class {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section *</label>
                  <select 
                    name="targetSection" 
                    required
                    value={formData.targetSection}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-bold"
                  >
                    <option value="">Select</option>
                    {sections.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sections' : s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FiMessageSquare /> Announcement Message *
                </label>
                <textarea 
                  name="content"
                  required
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your announcement details here..."
                  rows="5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-medium resize-none custom-scrollbar"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full mt-2 py-4 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSend size={20} />}
                {submitting ? 'Publishing...' : 'Publish Notice'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Notice Board Feed */}
        <div className="xl:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 h-full min-h-[500px] flex flex-col">
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 w-full md:w-max">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'received' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiInbox size={16} /> Admin Updates
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'published' ? 'bg-white text-amber-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiFileText size={16} /> My Classes
              </button>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-4"></div>
                <p className="font-bold">Syncing notice board...</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                
                {/* 🔴 RECEIVED NOTICES VIEW */}
                {activeTab === 'received' && (
                  <>
                    {receivedNotices.length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FiInbox size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-bold text-lg text-slate-700">Inbox Empty</p>
                        <p className="text-sm font-medium text-slate-400 mt-1">No official announcements from the Admin yet.</p>
                      </div>
                    ) : (
                      receivedNotices.map((notice) => (
                        <div key={notice._id} className="bg-white border border-indigo-100 rounded-2xl p-5 md:p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group relative">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                                  <FiShield /> {notice.type || 'NOTICE'}
                                </span>
                                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                                  {notice.sentTo === 'All' ? 'School Wide' : 'Faculty Only'}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-lg leading-tight pr-10">
                                {notice.title}
                              </h4>
                            </div>
                            
                            {/* File Download Button if Admin attached a document */}
                            {notice.file?.url && (
                              <a 
                                href={notice.file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="md:absolute top-6 right-6 shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-colors border border-indigo-100"
                              >
                                <FiDownloadCloud size={14} /> Open File
                              </a>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2 text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1"><FiCalendar /> {formatDate(notice.createdAt)}</span>
                            <span>By: {notice.generatedBy?.name || 'Administration'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* 🟠 PUBLISHED NOTICES VIEW */}
                {activeTab === 'published' && (
                  <>
                    {publishedNotices.length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FiSend size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-bold text-lg text-slate-700">No Notices Published</p>
                        <p className="text-sm font-medium text-slate-400 mt-1">Announcements you create will appear here.</p>
                      </div>
                    ) : (
                      publishedNotices.map((notice) => (
                        <div key={notice._id} className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2">
                                {notice.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                                  <FiFilter /> Class {notice.targetGrade} {notice.targetSection === 'All' ? '(All Sections)' : `- Sec ${notice.targetSection}`}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                  <FiCalendar /> {formatDate(notice.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                              {notice.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherNotices;