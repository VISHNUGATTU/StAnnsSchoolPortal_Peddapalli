import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiEdit3, FiUser, FiMail, FiPhone, FiBriefcase, FiAward, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherProfile = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/teacher/profile`, { withCredentials: true });
        if (data.success) {
          setProfile(data.teacher);
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
        <p className="text-slate-500 font-bold animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-fade-in font-sans relative pb-10">
      
      {/* Header Banner */}
      <div className="relative h-48 md:h-64 rounded-3xl bg-gradient-to-r from-indigo-600 to-teal-500 overflow-hidden shadow-lg mb-20 md:mb-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => navigate('/teacher/profile/edit')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-bold transition-all border border-white/10 shadow-sm"
          >
            <FiEdit3 /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Info Overlay */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-200/40 relative -mt-32 md:-mt-40 mx-4 md:mx-8">
        
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 border-b border-slate-100 pb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden shrink-0">
            {profile.image ? (
              <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-200 bg-indigo-50">
                <FiUser size={64} />
              </div>
            )}
          </div>
          
          <div className="text-center md:text-left flex-1">
            <p className="text-indigo-600 font-bold tracking-wider uppercase text-xs mb-1">
              Faculty ID: {profile.teacherId}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
              {profile.name}
            </h1>
            <p className="text-slate-500 font-medium text-lg mt-1 flex items-center justify-center md:justify-start gap-2">
              <FiBriefcase className="text-slate-400" /> {profile.designation || 'Teacher'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><FiMail /></span>
              Contact Information
            </h3>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="font-bold text-slate-700">{profile.mail}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="font-bold text-slate-700">{profile.phno}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
                <p className="font-bold text-slate-700">{new Date(profile.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><FiAward /></span>
              Attendance Record
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center">
                <FiCalendar className="mx-auto text-indigo-400 mb-2" size={24} />
                <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-wider">Total Days</p>
                <h4 className="text-3xl font-black text-indigo-700 mt-1">{profile.attendanceSummary?.totalDays || 0}</h4>
              </div>
              <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100 text-center">
                <FiCheckCircle className="mx-auto text-teal-400 mb-2" size={24} />
                <p className="text-xs font-bold text-teal-600/70 uppercase tracking-wider">Present</p>
                <h4 className="text-3xl font-black text-teal-700 mt-1">{profile.attendanceSummary?.presentDays || 0}</h4>
              </div>
              <div className="col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 text-center text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</p>
                <div className="flex items-end justify-center gap-1 mt-1">
                  <h4 className="text-4xl font-black text-white">{profile.attendanceSummary?.percentage?.toFixed(1) || 100}</h4>
                  <span className="text-xl font-bold text-slate-400 mb-1">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherProfile;