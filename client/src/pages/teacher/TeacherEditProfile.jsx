import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiUploadCloud, FiUser } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherEditProfile = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phno: '',
    mail: '',
    designation: ''
  });
  
  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/teacher/profile`, { withCredentials: true });
        if (data.success) {
          setFormData({
            name: data.teacher.name || '',
            phno: data.teacher.phno || '',
            mail: data.teacher.mail || '',
            designation: data.teacher.designation || ''
          });
          if (data.teacher.image) {
            setImagePreview(data.teacher.image);
          }
        }
      } catch (error) {
        toast.error("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [backendUrl]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be smaller than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('phno', formData.phno);
    submitData.append('mail', formData.mail);
    submitData.append('designation', formData.designation);
    
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    try {
      const { data } = await axios.put(`${backendUrl}/api/teacher/update`, submitData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success("Profile updated successfully!");
        navigate('/teacher/profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-4xl mx-auto animate-fade-in font-sans relative pb-10">
      
      {/* Back Button */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/teacher/profile')}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
        >
          <FiArrowLeft size={20} />
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-200/40">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Image Upload Area */}
          <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-slate-100">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden shadow-md flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={48} className="text-slate-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-slate-900/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <FiUploadCloud className="text-white text-3xl" />
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-800">Profile Picture</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">PNG, JPG or JPEG. Max size 2MB.</p>
              <button 
                type="button"
                onClick={() => document.querySelector('input[type="file"]').click()}
                className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-800"
              >
                Choose new image
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Designation</label>
              <input 
                type="text" 
                name="designation"
                required
                value={formData.designation}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                name="mail"
                required
                value={formData.mail}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <input 
                type="tel" 
                name="phno"
                required
                value={formData.phno}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/teacher/profile')}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TeacherEditProfile;