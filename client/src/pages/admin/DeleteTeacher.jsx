import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUserX, FiSearch, FiArrowLeft, FiAlertCircle, FiTrash2, FiUser } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const DeleteTeacher = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [searchId, setSearchId] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setTeacher(null);

    if (!searchId.trim()) {
      setSearchError("Please enter a Teacher ID to search.");
      return;
    }

    setLoadingSearch(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/teachers/all`, { withCredentials: true });

      if (data.success) {
        const found = data.teachers.find(t => t.teacherId.toLowerCase() === searchId.toLowerCase());
        if (found) setTeacher(found);
        else setSearchError(`No faculty record found for Teacher ID "${searchId}".`);
      }
    } catch (error) {
      setSearchError("Unable to connect to the server.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleDelete = async () => {
    if (!teacher) return;
    setDeleting(true);

    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/teacher/delete/${teacher._id}`, {
        withCredentials: true
      });

      if (data.success) {
        toast.success('Teacher record deleted successfully!');
        navigate('/admin/teachers');
      } else {
        toast.error(data.message || 'Failed to delete teacher');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error occurred');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3">
            <FiUserX className="text-rose-600" /> Delete Teacher
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Permanently remove a faculty member from the system.</p>
        </div>
        <button onClick={() => navigate('/admin/teachers')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm">
          <FiArrowLeft /> Back
        </button>
      </div>

      <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Teacher ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><FiSearch /></div>
              <input type="text" value={searchId} onChange={(e) => { setSearchId(e.target.value); if(searchError) setSearchError(''); }} placeholder="Enter Teacher ID (e.g. TCH1001)" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-rose-500" />
            </div>
          </div>
          <button type="submit" disabled={loadingSearch} className="px-8 py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 h-full">
            {loadingSearch ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchError && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
            <FiAlertCircle className="text-rose-500 mt-0.5" /><p className="text-rose-700 text-sm font-medium">{searchError}</p>
          </div>
        )}
      </div>

      {teacher && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl p-8 animate-slide-up">
          <div className="flex items-start gap-6 border-b border-rose-50 pb-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 overflow-hidden shrink-0">
              {teacher.image ? (
                <img src={`${backendUrl}${teacher.image}`} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                <FiUser size={40} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy">{teacher.name}</h2>
              <p className="text-slate-500 font-medium mt-1">ID: <span className="text-navy">{teacher.teacherId}</span> | {teacher.designation}</p>
              <div className="mt-3 flex gap-3 text-sm font-medium text-slate-500">
                <span className="bg-slate-100 px-3 py-1 rounded-lg">{teacher.mail}</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg">{teacher.phno}</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/50 rounded-2xl p-6 mb-8 border border-rose-100">
            <p className="text-rose-700 font-bold flex items-center gap-2">
              <FiAlertCircle className="text-rose-500" /> Warning: Destructive Action
            </p>
            <p className="text-rose-600/80 text-sm mt-2 font-medium">
              Deleting this record will permanently remove <span className="font-bold">{teacher.name}'s</span> login access, attendance logs, and profile data from the database. This action cannot be reversed.
            </p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => { setTeacher(null); setSearchId(''); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2">
              {deleting ? 'Removing...' : <><FiTrash2 /> Confirm Deletion</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteTeacher;