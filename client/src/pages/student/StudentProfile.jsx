import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiUser, FiEdit2, FiMail, FiPhone, 
  FiMapPin, FiCalendar, FiDroplet, FiBookOpen, FiUsers
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentProfile = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/profile`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          setProfile(data.profile);
        }
      } catch (error) {
        toast.error("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading student profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  // 🚨 SMART CHECK: Safely extract nested data based on AddStudent structure
  const fatherName = profile.father?.name || profile.fatherName;
  const motherName = profile.mother?.name || profile.motherName;
  const guardianName = profile.guardian?.name || profile.guardianName;
  const occupation = profile.father?.occupation || profile.mother?.occupation || profile.guardian?.occupation || profile.parentOccupation;
  const phone = profile.father?.mobile || profile.mother?.mobile || profile.guardian?.mobile || profile.parentPhone;

  const hasParentDetails = fatherName || motherName;
  const sectionTitle = hasParentDetails ? "Parent Details" : "Guardian Details";

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: ID Card */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-50 to-indigo-100/50"></div>
            
            <div className="w-32 h-32 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden z-10 mb-5 flex items-center justify-center relative">
              {profile.image ? (
                <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-4xl font-black text-indigo-300">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black text-slate-800 z-10 leading-tight mb-1">{profile.name}</h2>
            <p className="text-sm font-bold text-slate-400 z-10 uppercase tracking-wider mb-6">Student</p>

            <div className="w-full space-y-3 z-10">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roll No</span>
                <span className="font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded">{profile.rollno}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class</span>
                <span className="font-black text-slate-700">{profile.grade}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Section</span>
                <span className="font-black text-slate-700">{profile.section}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/student/profile/edit')}
            className="w-full bg-white border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 px-6 py-4 rounded-3xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm group shrink-0"
          >
            <FiEdit2 className="group-hover:scale-110 transition-transform" /> Edit Contact Details
          </button>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-5 px-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FiUser />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Personal Information</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><FiCalendar /> Date of Birth</p>
                <p className="font-bold text-slate-800">
                  {profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><FiDroplet /> Blood Group</p>
                <p className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded inline-block">
                  {profile.bloodGroup || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><FiMail /> Student Email</p>
                <p className="font-bold text-slate-800 break-all">{profile.mail || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-5 px-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiUsers />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{sectionTitle}</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Conditional Rendering: Show Parents OR Guardian using dynamic nested values */}
              {hasParentDetails ? (
                <>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Father's Name</p>
                    <p className="font-bold text-slate-800">{fatherName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Mother's Name</p>
                    <p className="font-bold text-slate-800">{motherName || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Guardian's Name</p>
                  <p className="font-bold text-slate-800">{guardianName || 'N/A'}</p>
                </div>
              )}
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><FiBookOpen /> Occupation</p>
                <p className="font-bold text-slate-800">{occupation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><FiPhone /> Contact Phone</p>
                <p className="font-bold text-slate-800">{phone || 'N/A'}</p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><FiMapPin /> Residential Address</p>
                <p className="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {profile.address && typeof profile.address === 'object' ? (
                    `${profile.address.houseNumber || ''}, ${profile.address.street || ''}, ${profile.address.villageCity || ''}, ${profile.address.mandal || ''}, ${profile.address.district || ''}, ${profile.address.state || ''} - ${profile.address.pinCode || ''}`.replace(/^,\s*|,\s*,\s*|,\s*$/, '')
                  ) : (
                    profile.address || 'No address provided.'
                  )}
                </p>
              </div>
              
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentProfile;