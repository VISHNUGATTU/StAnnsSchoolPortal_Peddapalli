import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiUsers, FiMonitor, FiActivity, FiServer, FiClock, FiAlertCircle } from "react-icons/fi";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const AdminHome = () => {
  const { backendUrl, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    systemHealth: "Unknown",
    latency: 0,
    recentLogs: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, teachersRes, healthRes, logsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/admin/students/all`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/admin/teacher-count`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/admin/health`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/logs/all`, { withCredentials: true })
        ]);

        setDashboardData({
          totalStudents: studentsRes.data.students?.length || 0,
          totalTeachers: teachersRes.data.totalTeachers || 0,
          systemHealth: healthRes.data.database === 'connected' ? 'Operational' : 'Degraded',
          latency: healthRes.data.latency || 0,
          recentLogs: logsRes.data.logs?.slice(0, 6) || []
        });
      } catch (error) {
        toast.error("Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in mt-4">
      {/* 🚨 UPDATED: Removed the redundant 'Welcome back' header block as requested */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center text-navy">
              <FiUsers size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">+Active</span>
          </div>
          <h3 className="text-3xl font-bold text-navy">{dashboardData.totalStudents}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Enrolled Students</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold-dark">
              <FiMonitor size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">+Active</span>
          </div>
          <h3 className="text-3xl font-bold text-navy">{dashboardData.totalTeachers}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Faculty Members</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <FiServer size={24} />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${dashboardData.systemHealth === 'Operational' ? 'text-emerald-600 bg-emerald-100' : 'text-rose-600 bg-rose-100'}`}>
              {dashboardData.systemHealth}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-navy">DB Status</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Core Infrastructure</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
              <FiActivity size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">Ping</span>
          </div>
          <h3 className="text-3xl font-bold text-navy">{dashboardData.latency}<span className="text-lg text-slate-400 ml-1">ms</span></h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Server Latency</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <FiClock className="text-gold-dark" /> Recent System Activity
          </h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {dashboardData.recentLogs.length > 0 ? (
            dashboardData.recentLogs.map((log) => (
              <div key={log._id} className="p-6 flex items-start gap-4 hover:bg-slate-50/80 transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : log.status === 'Failed' ? 'bg-rose-500' : 'bg-gold'}`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-navy">{log.title}</p>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1">{log.message}</p>
                  {log.actor?.name && (
                    <p className="text-xs font-semibold text-gold-dark mt-2">By: {log.actor.name} ({log.actor.role})</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
              <FiAlertCircle size={24} className="text-slate-300" />
              <p className="font-medium">No recent activity logs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;