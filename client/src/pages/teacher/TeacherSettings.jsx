import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiSettings, FiLock, FiBell, 
  FiLogOut, FiShield, FiSave 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const TeacherSettings = () => {
  const { backendUrl, setIsAuthenticated } = useAppContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    pushNotifications: false,
    weeklyReports: true
  });

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    if (passwords.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      const { data } = await axios.put(`${backendUrl}/api/teacher/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, { withCredentials: true });

      if (data.success) {
        toast.success("Password updated successfully!");
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ THE FIX: Moved toast outside of the state updater callback
  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preferences updated.");
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/teacher/logout`, {}, { 
        withCredentials: true 
      });
      
      if (data.success) {
        toast.success("Logged out successfully");
        if(setIsAuthenticated) setIsAuthenticated(false);
        navigate('/login');
      }
    } catch (error) {
      toast.error("Failed to log out properly.");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-4xl mx-auto animate-fade-in font-sans relative pb-10 mt-4">
      
      <div className="space-y-8">
        
        {/* Security / Password Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiShield size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Security</h3>
              <p className="text-sm font-medium text-slate-500">Update your password to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiLock /> Current Password
              </label>
              <input 
                type="password" 
                name="currentPassword"
                required
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  required
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 disabled:opacity-70 w-full md:w-auto justify-center"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />}
              Update Password
            </button>
          </form>
        </div>

        {/* Preferences Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FiBell size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Notifications</h3>
              <p className="text-sm font-medium text-slate-500">Manage how and when you receive alerts.</p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800">Email Alerts</h4>
                <p className="text-xs text-slate-500 font-medium">Receive important admin notices via email.</p>
              </div>
              <button 
                onClick={() => togglePreference('emailAlerts')}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${preferences.emailAlerts ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${preferences.emailAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800">Browser Push Notifications</h4>
                <p className="text-xs text-slate-500 font-medium">Get live alerts while using the portal.</p>
              </div>
              <button 
                onClick={() => togglePreference('pushNotifications')}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${preferences.pushNotifications ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${preferences.pushNotifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-rose-800">Log Out of Account</h3>
              <p className="text-sm font-medium text-rose-600/80 mt-1">
                You will need to re-enter your credentials the next time you access the portal.
              </p>
            </div>
            <button 
              onClick={handleLogout}
              disabled={logoutLoading}
              className="px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shrink-0 w-full md:w-auto"
            >
              {logoutLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FiLogOut />
              )}
              {logoutLoading ? 'Logging out...' : 'Secure Logout'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherSettings;