import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiActivity, FiSearch, FiFilter, FiClock, 
  FiUser, FiShield, FiDatabase, FiRefreshCw,
  FiTrash2, FiAlertTriangle, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AdminLogs = () => {
  const { backendUrl } = useAppContext();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Unified Modal State for Single Delete & Clear All
  const [modal, setModal] = useState({ isOpen: false, type: null, logId: null });

  // Make sure this matches how you mounted logRoute.js in server.js
  const API_BASE = `${backendUrl}/api/logs`; 

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Hitting the GET /all route from your logRoute.js
      const { data } = await axios.get(`${API_BASE}/all`, {
        withCredentials: true
      });
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      toast.error("Failed to load system logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  // Filter Logic matching your schema fields
  // Filter Logic matching your schema fields (Bulletproofed)
  const filteredLogs = logs.filter(log => {
    // 1. Safely extract fields, falling back to empty strings if they don't exist
    const safeTitle = log.title || "";
    const safeMessage = log.message || "";
    const safeActorName = log.actor?.name || "";
    
    // 2. Combine them and convert to lowercase safely
    const searchTarget = `${safeTitle} ${safeMessage} ${safeActorName}`.toLowerCase();
    const safeSearchQuery = (searchQuery || "").toLowerCase();
    
    // 3. Execute the matching logic
    const matchesSearch = searchTarget.includes(safeSearchQuery);
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Action Executor (Handles both single delete and clear all)
  const executeAction = async () => {
    try {
      if (modal.type === 'SINGLE' && modal.logId) {
        const { data } = await axios.delete(`${API_BASE}/${modal.logId}`, { withCredentials: true });
        if (data.success) {
          toast.success("Log entry deleted.");
          setLogs(logs.filter(l => l._id !== modal.logId));
        }
      } 
      else if (modal.type === 'CLEAR_ALL') {
        const { data } = await axios.delete(`${API_BASE}/clear-all`, { withCredentials: true });
        if (data.success) {
          toast.success("All audit logs purged successfully.");
          setLogs([]);
        }
      }
    } catch (error) {
      toast.error("Failed to execute action.");
    } finally {
      setModal({ isOpen: false, type: null, logId: null });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  // Status Badge Styling
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Success': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold border border-emerald-100"><FiCheckCircle /> Success</span>;
      case 'Failed': return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-bold border border-rose-100"><FiXCircle /> Failed</span>;
      case 'Warning': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-bold border border-amber-100"><FiAlertTriangle /> Warning</span>;
      default: return <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans relative">
      
      {/* IN-APP CONFIRMATION MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-navy text-center mb-2">
              {modal.type === 'CLEAR_ALL' ? 'Purge All Logs?' : 'Delete Log Entry?'}
            </h3>
            <p className="text-slate-500 text-center font-medium text-sm mb-8">
              {modal.type === 'CLEAR_ALL' 
                ? 'Are you sure you want to permanently delete ALL system logs? This action cannot be undone.'
                : 'Are you sure you want to delete this specific log entry?'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setModal({ isOpen: false, type: null, logId: null })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeAction}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
            <FiActivity className="text-indigo-500" /> System Audit Logs
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Monitor administrative actions, security events, and system performance.</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-70"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          
          <button 
            onClick={() => setModal({ isOpen: true, type: 'CLEAR_ALL' })}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 font-bold hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-50"
          >
            <FiTrash2 /> Delete All Logs
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/40 mb-8 flex flex-col md:flex-row gap-4">
        
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <FiSearch />
          </div>
          <input 
            type="text" 
            placeholder="Search by title, message, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-medium"
          />
        </div>

        <div className="md:w-64 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <FiFilter />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-navy font-bold appearance-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Warning">Warning</option>
          </select>
        </div>
        
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <FiDatabase className="text-slate-400" /> Recent Activity
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
            Showing {filteredLogs.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-slate-500">Fetching audit trail...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FiShield size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-lg text-navy">No Logs Found</p>
              <p className="text-sm font-medium mt-1">System audit trail is currently empty.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-48">Timestamp</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Action Type</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-48">Actor</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <FiClock className="text-slate-400 shrink-0" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-200 uppercase">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <FiUser size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy leading-tight">{log.actor?.name || 'System'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{log.actor?.role || 'System'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-slate-700">{log.title}</p>
                      {log.message && (
                        <p className="text-xs font-medium text-slate-500 mt-0.5 truncate max-w-sm" title={log.message}>
                          {log.message}
                        </p>
                      )}
                      {log.actor?.ipAddress && (
                        <p className="text-[10px] font-mono text-slate-400 mt-1">IP: {log.actor.ipAddress}</p>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setModal({ isOpen: true, type: 'SINGLE', logId: log._id })}
                        className="w-8 h-8 bg-white border border-slate-200 text-rose-400 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all hover:border-rose-500"
                        title="Delete Log Entry"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminLogs;