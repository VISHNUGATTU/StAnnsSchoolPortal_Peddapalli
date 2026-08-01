import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUserCheck, FiSave, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const ClassTeacherAssignment = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({
    grade: '1',
    section: 'A',
    teacherId: '',
    academicYear: new Date().getFullYear().toString()
  });

  const fetchData = async () => {
    try {
      const [teachersRes, assignmentsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/admin/available-class-teachers`, {
          params: { academicYear: formData.academicYear },
          withCredentials: true
        }),
        axios.get(`${backendUrl}/api/admin/class-teacher-assignments`, {
          params: { academicYear: formData.academicYear },
          withCredentials: true
        })
      ]);
      if (teachersRes.data.success) setTeachers(teachersRes.data.teachers);
      if (assignmentsRes.data.success) setAssignments(assignmentsRes.data.assignments);
    } catch (error) {
      toast.error("Failed to fetch assignment data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [formData.academicYear, backendUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacherId) {
      toast.error("Please select a teacher.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/assign-class-teacher`, formData, {
        withCredentials: true
      });
      
      if (data.success) {
        toast.success(data.message);
        setFormData({ ...formData, teacherId: '' });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign teacher.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/assign-class-teacher/${id}`, {
        withCredentials: true
      });
      if (data.success) {
        toast.success(data.message);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to remove assignment.");
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-navy font-medium";

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3">
          <FiUserCheck className="text-gold-dark" /> Assign Class Teacher
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Assign or unassign teachers for classes across academic years.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Academic Year</label>
            <input 
              type="text" 
              name="academicYear" 
              value={formData.academicYear} 
              onChange={handleChange} 
              className={inputClass} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Select Teacher</label>
            <select 
              name="teacherId" 
              value={formData.teacherId} 
              onChange={handleChange} 
              className={inputClass}
            >
              <option value="">-- Choose a Teacher --</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.teacherId})</option>
              ))}
            </select>
            {teachers.length === 0 && (
              <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                <FiAlertCircle /> No teachers available.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Grade</label>
            <select name="grade" value={formData.grade} onChange={handleChange} className={inputClass}>
              {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Section</label>
            <select name="section" value={formData.section} onChange={handleChange} className={inputClass}>
              {["A", "B", "C", "D"].map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-6">
          <button 
            type="submit" 
            disabled={loading} 
            className="px-8 py-3 rounded-xl font-bold text-white bg-navy hover:bg-navy-light flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : <><FiSave /> Confirm Assignment</>}
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        <h3 className="text-xl font-bold text-navy mb-4">Current Assignments ({formData.academicYear})</h3>
        {assignments.length === 0 ? (
          <p className="text-slate-400 text-sm">No class teachers assigned for this academic year yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map(a => (
              <div key={a._id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Class {a.grade} - Section {a.section}</span>
                  <span className="text-slate-500 text-sm ml-3">({a.teacherId?.name || 'Assigned Teacher'})</span>
                </div>
                <button 
                  onClick={() => handleRemove(a._id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Remove Assignment"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassTeacherAssignment;