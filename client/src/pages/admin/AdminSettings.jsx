import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiSettings, FiLock, FiShield, 
  FiActivity, FiDatabase, FiServer, FiCamera
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AdminSettings = () => {
  const { backendUrl } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('security');
  
  // System Health State
  const [sysHealth, setSysHealth] = useState(null);
  const [pinging, setPinging] = useState(false);

  const checkSystemHealth = async () => {
    setPinging(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/health`, {
        withCredentials: true
      });
      if (data.success) {
        setSysHealth(data);
        toast.success("System health check completed.");
      }
    } catch (error) {
      toast.error("Failed to ping system health.");
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans">
      
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
          <FiSettings className="text-slate-500" /> System Settings
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Manage security preferences and view system diagnostics.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <FiLock size={18} /> Security
          </button>
          <button 
            onClick={() => {
              setActiveTab('health');
              if (!sysHealth) checkSystemHealth();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'health' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <FiActivity size={18} /> Diagnostics
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* ======================= SECURITY TAB ======================= */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 animate-slide-up">
              <h2 className="text-xl font-bold text-navy mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                <FiShield className="text-emerald-500" /> Security Settings
              </h2>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center text-slate-500 mb-8">
                <FiLock size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-navy mb-2">Password Management</h3>
                <p className="text-sm font-medium max-w-md mx-auto">
                  To change your admin password or master batch password, please contact the{" "}
                  <strong className="font-bold">Developer</strong> to ensure strict security
                  protocols are followed.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                <FiShield className="text-emerald-500 mt-1 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-emerald-800">Account Secured</h4>
                  <p className="text-sm text-emerald-600/90 font-medium mt-1">Your session is currently encrypted with standard JWT authentication. Ensure you log out when using public terminals.</p>
                </div>
              </div>
            </div>
          )}

          {/* ======================= SYSTEM HEALTH TAB ======================= */}
          {activeTab === 'health' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 animate-slide-up">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                  <FiActivity className="text-sky-500" /> System Health
                </h2>
                <button 
                  onClick={checkSystemHealth}
                  disabled={pinging}
                  className="text-sm font-bold text-sky-600 bg-sky-50 px-4 py-2 rounded-lg hover:bg-sky-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FiActivity className={pinging ? "animate-pulse" : ""} /> Ping Server
                </button>
              </div>

              {!sysHealth && !pinging ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  Click "Ping Server" to fetch the latest diagnostics.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sysHealth?.database === 'connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <FiDatabase size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Connection</p>
                        <p className="font-bold text-navy text-lg capitalize">{sysHealth?.database || 'Checking...'}</p>
                      </div>
                    </div>

                    <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <FiActivity size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network Latency</p>
                        <p className="font-bold text-navy text-lg">{sysHealth?.latency ? `${sysHealth.latency} ms` : '---'}</p>
                      </div>
                    </div>

                    <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <FiServer size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Engine</p>
                        <p className="font-bold text-navy text-lg capitalize">{sysHealth?.schoolEngine || '---'}</p>
                      </div>
                    </div>

                    <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <FiCamera size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Engine</p>
                        <p className="font-bold text-navy text-lg capitalize">{sysHealth?.storageEngine || '---'}</p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;