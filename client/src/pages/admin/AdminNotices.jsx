import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBell, FiPlus, FiTrash2, FiUsers, FiCalendar, 
  FiX, FiSend, FiFileText, FiTarget, FiUser, FiAlertTriangle 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AdminNotices = () => {
  const { backendUrl } = useAppContext();
  
  // State
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, noticeId: null });
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'Global', 
    targetGrade: '1',
    targetSection: 'A'
  });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/notice/all`, {
        withCredentials: true
      });
      if (data.success) {
        setNotices(data.notices);
      }
    } catch (error) {
      toast.error("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/notice/create`, formData, {
        withCredentials: true
      });

      if (data.success) {
        toast.success("Notice broadcasted successfully!");
        setFormData({ title: '', content: '', type: 'Global', targetGrade: '1', targetSection: 'A' });
        setIsCreating(false);
        fetchNotices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to publish notice.");
    } finally {
      setSaving(false);
    }
  };

  // 1. Open the modal instead of deleting immediately
  const triggerDelete = (id) => {
    setDeleteModal({ isOpen: true, noticeId: id });
  };

  // 2. Execute the actual deletion when confirmed inside the modal
  const confirmDelete = async () => {
    if (!deleteModal.noticeId) return;

    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/notice/delete/${deleteModal.noticeId}`, {
        withCredentials: true
      });

      if (data.success) {
        toast.success("Notice deleted.");
        setNotices(notices.filter(n => n._id !== deleteModal.noticeId));
      }
    } catch (error) {
      toast.error("Failed to delete notice.");
    } finally {
      setDeleteModal({ isOpen: false, noticeId: null }); // Close modal
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans relative">
      
      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-navy text-center mb-2">Delete Notice?</h3>
            <p className="text-slate-500 text-center font-medium text-sm mb-8">
              Are you sure you want to permanently remove this announcement? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, noticeId: null })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
            <FiBell className="text-sky-500" /> Digital Notice Board
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Broadcast announcements globally or to specific classes.</p>
        </div>
        
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/30 shrink-0"
          >
            <FiPlus size={20} /> Compose Notice
          </button>
        )}
      </div>

      {/* Compose Form */}
      {isCreating && (
        <div className="bg-white/80 backdrop-blur-xl border border-sky-200 rounded-3xl p-6 md:p-8 shadow-2xl shadow-sky-900/5 mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6 border-b border-sky-100 pb-4">
            <h3 className="text-xl font-serif font-bold text-navy flex items-center gap-2">
              <FiSend className="text-sky-500" /> New Announcement
            </h3>
            <button 
              onClick={() => setIsCreating(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject / Title *</label>
                <input 
                  type="text" 
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Annual Sports Meet"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-navy font-bold"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notice Type *</label>
                <select 
                  name="type" 
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-navy font-bold"
                >
                  <option value="Global">Global (All Students & Staff)</option>
                  <option value="Class">Specific Class & Section</option>
                </select>
              </div>
            </div>

            {/* Dynamic Class Selection fields */}
            {formData.type === 'Class' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-sky-50/50 p-4 rounded-xl border border-sky-100 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Grade</label>
                  <select 
                    name="targetGrade" 
                    value={formData.targetGrade}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-navy font-bold"
                  >
                    {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => (
                      <option key={g} value={g}>Class {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Section</label>
                  <select 
                    name="targetSection" 
                    value={formData.targetSection}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-navy font-bold"
                  >
                    {["A", "B", "C", "D"].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notice Content *</label>
              <textarea 
                name="content"
                required
                rows="4"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your detailed announcement here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-navy font-medium resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="px-8 py-3 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSend />}
                {saving ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-sky-500">
            <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-slate-500">Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiFileText size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-1">No Active Notices</h3>
            <p className="text-slate-500 font-medium">The digital notice board is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notices.map((notice) => (
              <div key={notice._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-sky-200 transition-all flex flex-col relative group">
                
                {/* Replaced native confirm with our triggerDelete function */}
                <button 
                  onClick={() => triggerDelete(notice._id)}
                  className="absolute top-4 right-4 w-9 h-9 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                  title="Delete Notice"
                >
                  <FiTrash2 size={16} />
                </button>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notice.type === 'Global' ? 'bg-sky-50 text-sky-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    {notice.type === 'Global' ? <FiBell size={24} /> : <FiTarget size={24} />}
                  </div>
                  <div className="pr-10">
                    <h3 className="text-lg font-bold text-navy leading-tight mb-1">{notice.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1"><FiCalendar /> {formatDate(notice.createdAt)}</span>
                      
                      {notice.type === 'Global' ? (
                        <span className="flex items-center gap-1 text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md"><FiUsers /> Global Notice</span>
                      ) : (
                        <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Class {notice.targetGrade}-{notice.targetSection}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 flex-1 border border-slate-100 mb-4">
                  <p className="text-slate-600 font-medium text-sm whitespace-pre-wrap leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-t border-slate-100 pt-3">
                  <FiUser /> Posted by: <span className="text-slate-600">{notice.createdBy?.name || 'Admin'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminNotices;