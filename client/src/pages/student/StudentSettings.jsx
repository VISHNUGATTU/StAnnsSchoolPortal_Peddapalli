import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Shield, 
  Save, Loader2, Mail, Phone, 
  Eye, EyeOff, BookOpen
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudentSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State maps strictly to your database schema
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      mail: '',
      phno: '',
      rollno: '',
      branch: '',
      year: '',
      section: ''
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/api/student/settings', { withCredentials: true });
        if (data.success) {
          setSettings(prev => ({
            ...prev,
            profile: { ...prev.profile, ...data.settings.profile }
          }));
        }
      } catch (err) {
        toast.error("Failed to load settings data");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      const endpoint = `/api/student/settings/${section}`;
      const payload = settings[section];

      if (section === 'security') {
        if (payload.newPassword !== payload.confirmPassword) {
          toast.error("New passwords do not match!");
          setSaving(false);
          return;
        }
      }

      const { data } = await axios.put(endpoint, payload, { withCredentials: true });
      
      if (data.success) {
        toast.success(data.message || `${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`);
        
        if (section === 'security') {
          setSettings(prev => ({
            ...prev, security: { currentPassword: '', newPassword: '', confirmPassword: '' }
          }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update ${section}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 text-indigo-600 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="font-medium text-gray-500">Loading your preferences...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'security', label: 'Security & Password', icon: <Lock size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="mt-1.5 text-gray-500 font-medium">Manage your contact details and security.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR TABS */}
          <div className="lg:w-64 shrink-0">
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200">
              
              {/* --- PROFILE TAB --- */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><User size={22}/></div>
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  </div>

                  {/* Read Only Academic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                    <InputField label="Full Name" value={settings.profile.name} disabled />
                    <InputField label="Roll Number" value={settings.profile.rollno} disabled />
                    <InputField label="Branch" value={settings.profile.branch} disabled />
                    <div className="flex gap-4">
                      <div className="flex-1"><InputField label="Year" value={settings.profile.year} disabled /></div>
                      <div className="flex-1"><InputField label="Section" value={settings.profile.section} disabled /></div>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-6" />

                  {/* Editable Contact Info */}
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <Mail size={16} className="text-indigo-500"/> Contact Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                      label="Email Address (Mail)" 
                      type="email" 
                      icon={<Mail size={16} />}
                      value={settings.profile.mail} 
                      onChange={(e) => handleInputChange('profile', 'mail', e.target.value)} 
                    />
                    <InputField 
                      label="Phone Number (Phno)" 
                      type="tel" 
                      icon={<Phone size={16} />}
                      value={settings.profile.phno} 
                      onChange={(e) => handleInputChange('profile', 'phno', e.target.value)} 
                    />
                  </div>

                  <SaveButton saving={saving} onClick={() => handleSave('profile')} />
                </div>
              )}

              {/* --- SECURITY TAB --- */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Shield size={22}/></div>
                    <h2 className="text-xl font-bold text-gray-900">Security & Password</h2>
                  </div>

                  <div className="space-y-5 max-w-md">
                    <InputField 
                      label="Current Password" 
                      type={showPassword ? "text" : "password"} 
                      value={settings.security.currentPassword} 
                      onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)} 
                      icon={
                        <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-indigo-600 focus:outline-none">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                      iconPosition="right"
                    />
                    <InputField 
                      label="New Password" 
                      type="password" 
                      value={settings.security.newPassword} 
                      onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)} 
                    />
                    <InputField 
                      label="Confirm New Password" 
                      type="password" 
                      value={settings.security.confirmPassword} 
                      onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)} 
                    />
                  </div>

                  <SaveButton saving={saving} onClick={() => handleSave('security')} label="Update Password" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

/* --- REUSABLE SUB-COMPONENTS --- */

const InputField = ({ label, type = "text", value, onChange, disabled = false, icon, iconPosition = "left" }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      {icon && iconPosition === "left" && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input 
        type={type}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-300'}
          ${icon && iconPosition === "left" ? 'pl-10' : ''}
          ${icon && iconPosition === "right" ? 'pr-10' : ''}
        `}
      />
      {icon && iconPosition === "right" && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {icon}
        </div>
      )}
    </div>
  </div>
);

const SaveButton = ({ saving, onClick, label = "Save Changes" }) => (
  <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
    <button 
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
      {saving ? 'Saving...' : label}
    </button>
  </div>
);

export default StudentSettings;