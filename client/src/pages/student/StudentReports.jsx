import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiFolder, FiDownload, FiFileText, 
  FiImage, FiFile, FiClock, FiUser, FiInfo
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentReports = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/reports`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          setReports(data.reports);
        }
      } catch (error) {
        toast.error("Failed to load your reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [backendUrl]);

  // Helper to format bytes from the DB into KB/MB
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to render appropriate file icon and color
  const getFileStyle = (url, type, title) => {
    const extension = url ? url.split('.').pop().toLowerCase() : '';
    const reportType = type ? type.toUpperCase() : '';
    
    if (['pdf'].includes(extension) || reportType.includes('PDF')) {
      return { icon: <FiFileText />, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', label: 'PDF Document' };
    }
    if (['doc', 'docx', 'txt'].includes(extension)) {
      return { icon: <FiFileText />, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'Word Document' };
    }
    if (['xls', 'xlsx', 'csv'].includes(extension) || reportType.includes('EXCEL')) {
      return { icon: <FiFile />, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Spreadsheet' };
    }
    if (['png', 'jpg', 'jpeg'].includes(extension)) {
      return { icon: <FiImage />, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Image File' };
    }
    
    return { icon: <FiFile />, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', label: reportType || 'File' };
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading secure reports...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 md:p-5 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <FiInfo size={20} />
        </div>
        <div>
          <h4 className="text-indigo-900 font-bold text-sm mb-1">Read-Only Access</h4>
          <p className="text-indigo-700/80 font-medium text-xs md:text-sm leading-relaxed">
            This portal contains official documents uploaded by the school administration. You have view and download permissions only. If a report is missing or incorrect, please contact the main office.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
        {reports.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FiFolder size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Reports Available</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto">
              The administration has not generated any official reports for your profile yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => {
              // Access the nested file object from your schema
              const fileData = report.file || {}; 
              const fileStyle = getFileStyle(fileData.url, fileData.fileType || report.type, report.title);
              
              return (
                <div 
                  key={report._id} 
                  className="p-5 md:p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-6 group"
                >
                  
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border ${fileStyle.bg} ${fileStyle.text} ${fileStyle.border} group-hover:scale-105 transition-transform duration-300`}>
                    {fileStyle.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200">
                        {fileStyle.label}
                      </span>
                      {fileData.size && (
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          {formatBytes(fileData.size)}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                      {report.title}
                    </h3>
                    
                    <p className="text-sm text-slate-500 font-medium mb-3">
                      {fileData.fileName || "Secure Document"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <FiUser /> Generated by {report.generatedBy?.name || "System Admin"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiClock /> 
                        {new Date(report.createdAt).toLocaleDateString('en-GB', { 
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 mt-4 md:mt-0">
                    <a 
                      href={fileData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full md:w-auto bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-600/20"
                    >
                      <FiDownload /> View / Download
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentReports;