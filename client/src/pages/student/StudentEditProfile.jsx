import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiEdit, FiSave, FiArrowLeft, FiMail, 
  FiPhone, FiMapPin, FiLock, FiInfo
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentEditProfile = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Read-only data for display
  const [coreDetails, setCoreDetails] = useState(null);
  
  // Editable form data
  const [formData, setFormData] = useState({
    mail: '',
    parentPhone: '',
    address: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/profile`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          const profile = data.profile;
          
          // Format object address to string safely to avoid React crashing in the text area
          let formattedAddress = profile.address || '';
          if (profile.address && typeof profile.address === 'object') {
            formattedAddress = `${profile.address.houseNumber || ''}, ${profile.address.street || ''}, ${profile.address.villageCity || ''}, ${profile.address.mandal || ''}, ${profile.address.district || ''}, ${profile.address.state || ''} - ${profile.address.pinCode || ''}`.replace(/^,\s*|,\s*,\s*|,\s*$/, '');
          }

          // Extract correct nested mobile number
          const phone = profile.parentPhone || profile.father?.mobile || profile.mother?.mobile || profile.guardian?.mobile || '';

          // Set editable fields
          setFormData({
            mail: profile.mail || '',
            parentPhone: phone,
            address: formattedAddress
          });
          // Store the rest for display
          setCoreDetails(profile);
        }
      } catch (error) {
        toast.error("Failed to load profile details.");
        navigate('/student/profile'); // Redirect back if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [backendUrl, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await axios.put(`${backendUrl}/api/student/update-profile`, formData, {
        withCredentials: true
      });

      if (data.success) {
        toast.success("Profile updated successfully!");
        navigate('/student/profile');
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
        <p className="text-slate-500 font-bold animate-pulse">Loading secure form...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      {/* Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/student/profile')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 md:p-5 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <FiInfo size={20} />
        </div>
        <div>
          <h4 className="text-amber-900 font-bold text-sm mb-1">Restricted Modification</h4>
          <p className="text-amber-700/80 font-medium text-xs md:text-sm leading-relaxed">
            For security reasons, students can only update contact information and addresses. Core details (Name, Class, Roll No, Guardian Names) are locked. Please contact the administration office if these require changes.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
        
        {/* Read-Only Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
            {coreDetails?.image ? (
              <img src={coreDetails.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-indigo-400">{coreDetails?.name?.charAt(0)}</span>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-2">
              {coreDetails?.name} <FiLock className="text-slate-400" size={16} />
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm font-bold text-slate-500">
              <span className="bg-white border border-slate-200 px-3 py-1 rounded-md">Roll: {coreDetails?.rollno}</span>
              <span className="bg-white border border-slate-200 px-3 py-1 rounded-md">Class: {coreDetails?.grade}-{coreDetails?.section}</span>
            </div>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">
            Editable Contact Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Student Email */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FiMail className="text-indigo-500" /> Student Email Address
              </label>
              <input 
                type="email" 
                name="mail"
                value={formData.mail}
                onChange={handleChange}
                placeholder="Enter your personal email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-medium"
              />
              <p className="text-xs font-medium text-slate-400">Used for portal login and receiving official notices.</p>
            </div>

            {/* Guardian Phone */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FiPhone className="text-indigo-500" /> Contact Phone Number
              </label>
              <input 
                type="tel" 
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="Enter emergency contact number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-medium"
              />
              <p className="text-xs font-medium text-slate-400">Primary contact number for emergencies and alerts.</p>
            </div>

            {/* Residential Address */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FiMapPin className="text-indigo-500" /> Residential Address
              </label>
              <textarea 
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full residential address"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-medium resize-none"
              ></textarea>
            </div>

          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-70 w-full md:w-auto justify-center"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FiSave />
              )}
              {saving ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default StudentEditProfile;