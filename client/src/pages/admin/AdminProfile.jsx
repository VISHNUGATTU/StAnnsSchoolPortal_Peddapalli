import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiUser, FiSave, FiMail, FiPhone, 
  FiHash, FiEdit2, FiX 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AdminProfile = () => {
  const { backendUrl, admin, setAdmin } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Toggle state

  const [profileData, setProfileData] = useState({
    name: '',
    mail: '',
    phone: '',
    adminId: ''
  });

  // Populate data
  useEffect(() => {
    if (admin) {
      setProfileData({
        name: admin.name || '',
        mail: admin.mail || '',
        phone: admin.phone || '',
        adminId: admin.adminId || ''
      });
    }
  }, [admin]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const cancelEdit = () => {
    // Revert changes back to current global admin state
    if (admin) {
      setProfileData({
        name: admin.name || '',
        mail: admin.mail || '',
        phone: admin.phone || '',
        adminId: admin.adminId || ''
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.put(`${backendUrl}/api/admin/update`, {
        name: profileData.name,
        mail: profileData.mail,
        phone: profileData.phone
      }, {
        withCredentials: true
      });

      if (data.success) {
        toast.success("Profile updated successfully!");
        
        // Safety check: Only update context if the function exists
        if (typeof setAdmin === 'function') {
          setAdmin(data.admin); 
        }
        
        setIsEditing(false); // Switch back to view mode
      }
    } catch (error) {
      console.error("Profile Update Error:", error); // Prints the REAL error to your browser console
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

    

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
            <FiUser className="text-indigo-500" /> Administrative Profile
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your personal credentials and contact information.</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
          >
            <FiEdit2 size={16} /> Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Decorative Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-sky-500 relative">
          <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-full p-1.5 shadow-lg">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <FiUser size={40} />
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8">
          
          {/* ================= VIEW MODE ================= */}
          {!isEditing ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-navy mb-6">{profileData.name || 'Admin User'}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <FiHash />
                    <span className="text-xs font-bold uppercase tracking-wider">Admin ID</span>
                  </div>
                  <p className="font-bold text-navy text-lg">{profileData.adminId}</p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <FiMail />
                    <span className="text-xs font-bold uppercase tracking-wider">Email Address</span>
                  </div>
                  <p className="font-bold text-navy text-lg">{profileData.mail}</p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <FiPhone />
                    <span className="text-xs font-bold uppercase tracking-wider">Phone Number</span>
                  </div>
                  <p className="font-bold text-navy text-lg">{profileData.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            
          /* ================= EDIT MODE ================= */
            <form onSubmit={handleSubmit} className="animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <FiHash size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administrative ID</p>
                    <p className="font-bold text-navy">{profileData.adminId} <span className="text-xs text-slate-400 font-medium ml-2">(Cannot be changed)</span></p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text" name="name" required
                    value={profileData.name} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" name="mail" required
                    value={profileData.mail} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input 
                    type="text" name="phone"
                    value={profileData.phone} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-bold transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <FiX /> Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />}
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminProfile;