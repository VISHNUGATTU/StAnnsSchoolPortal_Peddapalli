import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUserX, FiSearch, FiArrowLeft, FiAlertCircle, FiTrash2, FiUser } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const DeleteStudent = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [searchParams, setSearchParams] = useState({ grade: '1', section: 'A', rollno: '' });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [student, setStudent] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    if (searchError) setSearchError('');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setStudent(null);

    if (!searchParams.rollno.trim()) {
      setSearchError("Please enter a Roll Number to search.");
      return;
    }

    setLoadingSearch(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/students/all`, { withCredentials: true });

      if (data.success) {
        const found = data.students.find(s => 
          s.grade === searchParams.grade && 
          s.section === searchParams.section && 
          s.rollno.toLowerCase() === searchParams.rollno.toLowerCase()
        );
        
        if (found) setStudent(found);
        else setSearchError(`No student record found for Roll Number "${searchParams.rollno}".`);
      }
    } catch (error) {
      setSearchError("Unable to connect to the server.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    setDeleting(true);

    try {
      const { data } = await axios.delete(`${backendUrl}/api/student/delete/${student._id}`, {
        withCredentials: true
      });

      if (data.success) {
        toast.success('Student deleted successfully!');
        navigate('/admin/students');
      } else {
        toast.error(data.message || 'Failed to delete student');
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
            <FiUserX className="text-rose-600" /> Delete Student
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Permanently remove a student record from the system.</p>
        </div>
        <button onClick={() => navigate('/admin/students')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm">
          <FiArrowLeft /> Back
        </button>
      </div>

      <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Grade/Class</label>
              <select name="grade" value={searchParams.grade} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-rose-500">
                {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => <option key={g} value={g}>Class {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Section</label>
              <select name="section" value={searchParams.section} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-rose-500">
                {["A", "B", "C", "D"].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Roll Number</label>
              <input type="text" name="rollno" value={searchParams.rollno} onChange={handleSearchChange} placeholder="Enter Roll No" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-rose-500" />
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

      {student && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl p-8 animate-slide-up">
          <div className="flex items-start gap-6 border-b border-rose-50 pb-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 overflow-hidden shrink-0">
              {student.image ? (
                <img src={`${backendUrl}${student.image}`} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <FiUser size={40} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy">{student.name}</h2>
              <p className="text-slate-500 font-medium mt-1">
                ADNO: <span className="text-navy">{student.adno || 'N/A'}</span> | Roll No: {student.rollno} | Class {student.grade}-{student.section}
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full uppercase tracking-wider">Ready to Delete</span>
            </div>
          </div>

          <div className="bg-rose-50/50 rounded-2xl p-6 mb-8 border border-rose-100">
            <p className="text-rose-700 font-bold flex items-center gap-2">
              <FiAlertCircle className="text-rose-500" /> Warning: Destructive Action
            </p>
            <p className="text-rose-600/80 text-sm mt-2 font-medium">
              Deleting this record will permanently remove all associated academic data, attendance logs, and fee records from the database. This action cannot be reversed.
            </p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStudent(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2">
              {deleting ? 'Removing...' : <><FiTrash2 /> Confirm Delete</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteStudent;