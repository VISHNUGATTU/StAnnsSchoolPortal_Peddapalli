import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiFolder, FiUploadCloud, FiTrash2, 
  FiEye, FiAlertTriangle, FiFileText, 
  FiFilter, FiBookOpen, FiAlignLeft,
  FiInbox, FiDownloadCloud, FiShield, FiCalendar
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherReports = () => {
  const { backendUrl } = useAppContext();
  
  // Data State
  const [materials, setMaterials] = useState([]);
  const [receivedReports, setReceivedReports] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('received'); // 'uploaded' or 'received'
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, materialId: null });
  
  // Form State
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade: '',
    section: '',
    subject: ''
  });

  const grades = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C", "D", "All"];
  const subjects = ["Mathematics", "Science", "English", "Social Studies", "Robotics","Moral Science","General Knowledge","STEM","Physics","Telugu","Hindi", "Chemistry", "Biology", "Computer Science", "General"];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [materialsRes, receivedRes] = await Promise.all([
        axios.get(`${backendUrl}/api/teacher/study-material/all`, { withCredentials: true }),
        axios.get(`${backendUrl}/api/teacher/reports/received`, { withCredentials: true })
      ]);

      if (materialsRes.data.success) {
        setMaterials(materialsRes.data.materials);
      }
      
      if (receivedRes.data.success) {
        // SMART FILTER: Only show items that actually have a file attached in the "Reports" view
        const documentsOnly = receivedRes.data.reports.filter(report => report.file && report.file.url);
        setReceivedReports(documentsOnly);
      }
      
    } catch (error) {
      toast.error("Failed to load reports and materials.");
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        e.target.value = null; 
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) return toast.error("Please select a file to upload.");
    if (!formData.grade || !formData.section || !formData.subject) {
      return toast.error("Please fill in all classification fields.");
    }

    setUploading(true);

    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('grade', formData.grade);
    uploadData.append('section', formData.section);
    uploadData.append('subject', formData.subject);
    uploadData.append('file', file);
    
    try {
      const { data } = await axios.post(`${backendUrl}/api/teacher/study-material/upload`, uploadData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      if (data.success) {
        toast.success("Material uploaded successfully!");
        setFormData({ title: '', description: '', grade: '', section: '', subject: '' });
        setFile(null);
        document.getElementById('file-upload').value = ''; 
        
        fetchAllData(); 
        setActiveTab('uploaded'); // Switch to uploads tab so they can see their new file
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload material.");
    } finally {
      setUploading(false);
    }
  };

  const triggerDelete = (id) => setDeleteModal({ isOpen: true, materialId: id });

  const confirmDelete = async () => {
    if (!deleteModal.materialId) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/teacher/study-material/delete/${deleteModal.materialId}`, {
        withCredentials: true
      });
      if (data.success) {
        toast.success("Material deleted successfully.");
        setMaterials(materials.filter(m => m._id !== deleteModal.materialId));
      }
    } catch (error) {
      toast.error("Failed to delete material.");
    } finally {
      setDeleteModal({ isOpen: false, materialId: null });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown Size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans relative pb-10 mt-4">
      
      {/* DELETE MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Material?</h3>
            <p className="text-slate-500 text-center font-medium text-sm mb-8">
              Are you sure you want to remove this document? Students will lose access immediately.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, materialId: null })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Upload Form */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 sticky top-6">
            <h3 className="text-xl font-serif font-bold text-slate-800 border-l-4 border-indigo-500 pl-3 mb-6">
              Upload New File
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Document File *</label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:border-indigo-400 bg-slate-50 transition-all text-center group">
                  <input type="file" id="file-upload" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <FiUploadCloud className={`mx-auto mb-2 text-3xl ${file ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-400'} transition-colors`} />
                  <p className="text-sm font-bold text-slate-700 truncate px-2">{file ? file.name : 'Click or drag file to upload'}</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">PDF, DOC, JPG (Max 5MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleInputChange} placeholder="e.g. Chapter 4 Chemistry Notes" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Grade*</label>
                  <select name="grade" required value={formData.grade} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold">
                    <option value="">Select</option>
                    {grades.map(g => <option key={g} value={g}>Class {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section *</label>
                  <select name="section" required value={formData.section} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold">
                    <option value="">Select</option>
                    {sections.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sections' : s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject *</label>
                <select name="subject" required value={formData.subject} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold">
                  <option value="">Select Subject</option>
                  {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FiAlignLeft /> Brief Description
                </label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Optional details or instructions..." rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium resize-none custom-scrollbar"></textarea>
              </div>

              <button type="submit" disabled={uploading} className="w-full mt-2 py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiUploadCloud size={20} />}
                {uploading ? 'Uploading to Database...' : 'Upload Material'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Document Feeds */}
        <div className="xl:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 h-full min-h-[500px] flex flex-col">
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 w-full md:w-max">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'received' ? 'bg-white text-teal-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiInbox size={16} /> Admin Documents
              </button>
              <button
                onClick={() => setActiveTab('uploaded')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'uploaded' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiFileText size={16} /> My Uploads
              </button>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-indigo-500">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-500">Syncing documents...</p>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                
                {/* 🟢 RECEIVED ADMIN DOCUMENTS */}
                {activeTab === 'received' && (
                  <>
                    {receivedReports.length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FiInbox size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-bold text-lg text-slate-700">Inbox Empty</p>
                        <p className="text-sm font-medium text-slate-400 mt-1">No official documents from the Admin yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {receivedReports.map((report) => (
                          <div key={report._id} className="bg-white border border-teal-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-teal-500/5 transition-all relative flex flex-col justify-between">
                            
                            <a href={report.file?.url} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-4 w-8 h-8 bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                              <FiDownloadCloud size={14} />
                            </a>

                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black bg-teal-100 text-teal-700 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                                  <FiShield /> {report.type || 'REPORT'}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2 pr-10">{report.title}</h4>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                              <span className="flex items-center gap-1"><FiCalendar /> {formatDate(report.createdAt)}</span>
                              <span className="uppercase">{formatBytes(report.file?.size)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 🔵 TEACHER'S OWN UPLOADS */}
                {activeTab === 'uploaded' && (
                  <>
                    {materials.length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FiFolder size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-bold text-lg text-slate-700">No Materials Uploaded</p>
                        <p className="text-sm font-medium text-slate-400 mt-1">Files you upload will appear here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {materials.map((material) => (
                          <div key={material._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group relative flex flex-col justify-between">
                            
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={material.fileUrl || material.link} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                                <FiEye size={14} />
                              </a>
                              <button onClick={() => triggerDelete(material._id)} className="w-8 h-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                                <FiTrash2 size={14} />
                              </button>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                                  <FiBookOpen /> {material.subject}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2 pr-16 line-clamp-2">{material.title}</h4>
                              <p className="text-xs font-bold text-teal-600 flex items-center gap-1 mb-2">
                                <FiFilter /> Class {material.grade} {material.section === 'All' ? '(All Sections)' : `- Sec ${material.section}`}
                              </p>
                              {material.description && (
                                <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">{material.description}</p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
                              <span>{formatDate(material.createdAt)}</span>
                              <span className="uppercase text-[10px] font-bold bg-slate-100 px-2 py-1 rounded">DOCUMENT</span>
                            </div>
                          </div>
                        ))}
                      </div>
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

export default TeacherReports;