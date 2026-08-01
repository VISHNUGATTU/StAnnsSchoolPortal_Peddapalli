import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiSettings, FiLock, FiLogOut, FiShield, 
  FiBell, FiEye, FiEyeOff, FiSave, FiAlertTriangle
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentSettings = () => {
  const { backendUrl, checkAuth } = useAppContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passFormData, setPassFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI State for Notification Toggles (Frontend visual only)
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    examReminders: true,
    feeReminders: false,
  });

  const handlePassChange = (e) => {
    setPassFormData({ ...passFormData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passFormData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (passFormData.newPassword !== passFormData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.put(`${backendUrl}/api/student/update-password`, passFormData, {
        withCredentials: true
      });

      if (data.success) {
        toast.success("Password updated successfully! Please use it for your next login.");
        setPassFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/student/logout`, {}, { withCredentials: true });
      if (data.success) {
        toast.success("Logged out successfully");
        sessionStorage.removeItem("role");
        await checkAuth(); // Clears user context
        navigate('/'); // Redirect to login
      }
    } catch (error) {
      toast.error("Error logging out.");
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Security & Password */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FiShield size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Security & Password</h2>
                  <p className="text-sm font-medium text-slate-500">Ensure your account uses a strong, secure password.</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <FiLock />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="currentPassword"
                      required
                      value={passFormData.currentPassword}
                      onChange={handlePassChange}
                      placeholder="Enter your current password" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-12 py-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="newPassword"
                      required
                      value={passFormData.newPassword}
                      onChange={handlePassChange}
                      placeholder="At least 6 characters" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="confirmPassword"
                      required
                      value={passFormData.confirmPassword}
                      onChange={handlePassChange}
                      placeholder="Retype new password" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <FiSave />
                    )}
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Danger Zone */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FiBell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Notifications</h2>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Important Email Alerts</span>
                <input 
                  type="checkbox" 
                  checked={notifications.emailAlerts}
                  onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Exam Schedule Changes</span>
                <input 
                  type="checkbox" 
                  checked={notifications.examReminders}
                  onChange={() => setNotifications({...notifications, examReminders: !notifications.examReminders})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Fee Due Reminders</span>
                <input 
                  type="checkbox" 
                  checked={notifications.feeReminders}
                  onChange={() => setNotifications({...notifications, feeReminders: !notifications.feeReminders})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone / Logout */}
          <div className="bg-rose-50 rounded-3xl border border-rose-100 p-6 md:p-8 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
             
             <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
               <FiAlertTriangle size={24} />
             </div>
             <h3 className="text-lg font-black text-rose-900 mb-1">Session Management</h3>
             <p className="text-xs font-medium text-rose-700/80 mb-6">
               Securely close your active session on this device.
             </p>
             
             <button 
                onClick={handleLogout}
                className="w-full bg-white hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
               <FiLogOut /> Secure Logout
             </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentSettings;