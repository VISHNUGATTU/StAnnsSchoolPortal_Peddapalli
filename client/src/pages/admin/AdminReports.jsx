import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiFileText, FiUploadCloud, FiTrash2, FiDownload, 
  FiEye, FiAlertTriangle, FiFile, FiUsers, FiFilter
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AdminReports = () => {
  const { backendUrl } = useAppContext();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null });
  const [file, setFile] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'NOTICE', // Changed default to NOTICE
    sentTo: 'All',
    targetGrade: '',
    targetSection: 'All' // Default section to 'All'
  });

  const API_BASE = `${backendUrl}/api/reports`;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/admin`, {
        withCredentials: true
      });
      if (data.success) {
        setReports(data.data); 
      }
    } catch (error) {
      toast.error("Failed to load uploaded reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-reset section if "All Classes" is selected
      if (name === 'targetGrade' && value === 'All') {
        updated.targetSection = 'All';
      }
      return updated;
    });
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

    setUploading(true);

    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('type', formData.type);
    uploadData.append('sentTo', formData.sentTo);
    uploadData.append('file', file);
    
    if (formData.sentTo === 'Student') {
      uploadData.append('targetGrade', formData.targetGrade);
      uploadData.append('targetSection', formData.targetSection);
    }

    try {
      const { data } = await axios.post(`${API_BASE}/create`, uploadData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      if (data.success) {
        toast.success("Report uploaded and distributed successfully!");
        setFormData({ title: '', type: 'NOTICE', sentTo: 'All', targetGrade: '', targetSection: 'All' });
        setFile(null);
        document.getElementById('file-upload').value = ''; 
        fetchReports(); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload report.");
    } finally {
      setUploading(false);
    }
  };

  const triggerDelete = (id) => setDeleteModal({ isOpen: true, reportId: id });

  const confirmDelete = async () => {
    if (!deleteModal.reportId) return;
    try {
      const { data } = await axios.delete(`${API_BASE}/${deleteModal.reportId}`, { withCredentials: true });
      if (data.success) {
        toast.success("Report deleted successfully.");
        setReports(reports.filter(r => r._id !== deleteModal.reportId));
      }
    } catch (error) {
      toast.error("Failed to delete report.");
    } finally {
      setDeleteModal({ isOpen: false, reportId: null });
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown Size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans relative">
      
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-navy text-center mb-2">Delete Report?</h3>
            <p className="text-slate-500 text-center font-medium text-sm mb-8">
              Are you sure you want to delete this document? It will be removed from Cloudinary and users will lose access.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, reportId: null })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
          <FiFileText className="text-teal-600" /> Document & Reports Hub
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Upload, manage, and distribute official school documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 sticky top-6">
            <h3 className="text-xl font-serif font-bold text-navy border-l-4 border-teal-500 pl-3 mb-6">Upload Document</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Document File *</label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:border-teal-400 bg-slate-50 transition-all text-center group">
                  <input type="file" id="file-upload" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <FiUploadCloud className={`mx-auto mb-2 text-3xl ${file ? 'text-teal-500' : 'text-slate-400 group-hover:text-teal-400'} transition-colors`} />
                  <p className="text-sm font-bold text-navy truncate px-2">{file ? file.name : 'Click or drag file to upload'}</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">PDF, DOC, XLS, JPG (Max 5MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Document Title *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleInputChange} placeholder="e.g. Term 1 Fee Schedule" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-navy font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Doc Type *</label>
                  <input type="text" name="type" required value={formData.type} onChange={handleInputChange} placeholder="e.g. NOTICE" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-navy font-bold uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Send To *</label>
                  <select name="sentTo" value={formData.sentTo} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-navy font-bold">
                    <option value="All">All Users</option>
                    <option value="Admin">Admins Only</option>
                    <option value="Teacher">Teachers</option>
                    <option value="Student">Students</option>
                  </select>
                </div>
              </div>

              {formData.sentTo === 'Student' && (
                <div className="grid grid-cols-2 gap-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">Target Class</label>
                    <select name="targetGrade" required value={formData.targetGrade} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 text-navy font-bold">
                      <option value="">Select</option>
                      {/* 🚨 ADDED "ALL CLASSES" OPTION */}
                      <option value="All">All Classes</option>
                      {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => (
                        <option key={g} value={g}>Class {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">Section</label>
                    <select 
                      name="targetSection" 
                      value={formData.targetSection}
                      onChange={handleInputChange}
                      disabled={formData.targetGrade === 'All'} // 🚨 DISABLED IF ALL CLASSES SELECTED
                      className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 text-navy font-bold ${formData.targetGrade === 'All' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                    >
                      <option value="All">All Sections</option>
                      {["A", "B", "C", "D"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" disabled={uploading} className="w-full mt-2 py-4 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiUploadCloud size={20} />}
                {uploading ? 'Uploading to Cloud...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/40 h-full">
            <h3 className="text-xl font-serif font-bold text-navy flex items-center gap-2 mb-6">
              <FiFile className="text-teal-500" /> Recent Documents
            </h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-teal-500">
                <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-500">Fetching cloud documents...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FiFileText size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-lg text-navy">No Reports Found</p>
                <p className="text-sm font-medium mt-1">Upload a document to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                  <div key={report._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-lg transition-all group relative flex flex-col justify-between">
                    
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={report.file?.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white rounded-full flex items-center justify-center transition-colors" title="View / Download">
                        <FiEye size={14} />
                      </a>
                      <button onClick={() => triggerDelete(report._id)} className="w-8 h-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors" title="Delete Document">
                        <FiTrash2 size={14} />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black bg-teal-100 text-teal-700 px-2.5 py-1 rounded-md tracking-wider">
                          {report.type}
                        </span>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                          <FiUsers /> {report.sentTo}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-navy text-lg leading-tight mb-2 pr-16 truncate" title={report.title}>
                        {report.title}
                      </h4>
                      
                      {/* UI Update to clearly display "All Classes" */}
                      {report.targetGrade && (
                        <p className="text-xs font-bold text-indigo-500 flex items-center gap-1 mb-2">
                          <FiFilter /> 
                          {report.targetGrade === 'All' 
                            ? "All Classes" 
                            : `Class ${report.targetGrade} ${report.targetSection !== 'All' ? `- Sec ${report.targetSection}` : '(All Sections)'}`}
                        </p>
                      )}
                      {/* UI Update to clearly display "All Classes" when values are null */}
                      {report.sentTo === 'Student' && (
                        <p className="text-xs font-bold text-indigo-500 flex items-center gap-1 mb-2">
                          <FiFilter /> 
                          {!report.targetGrade 
                            ? "All Classes" 
                            : `Class ${report.targetGrade} ${!report.targetSection ? '(All Sections)' : `- Sec ${report.targetSection}`}`}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
                      <span>{formatDate(report.createdAt)}</span>
                      <span className="uppercase">{report.file?.fileType?.split('/')[1] || 'FILE'} • {formatBytes(report.file?.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;