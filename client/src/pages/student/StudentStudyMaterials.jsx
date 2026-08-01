import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBookOpen, FiSearch, FiFilter, 
  FiDownload, FiFileText, FiImage, FiFile, FiClock, FiUser
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentStudyMaterials = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/study-materials`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          setMaterials(data.materials);
        }
      } catch (error) {
        toast.error("Failed to load study materials.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [backendUrl]);

  // Extract unique subjects for the filter dropdown
  const subjects = ['All', ...new Set(materials.map(m => m.subject))];

  // Apply search and subject filters
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || material.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Helper to render appropriate file icon based on URL extension
  const getFileIcon = (url) => {
    if (!url) return <FiFile />;
    const extension = url.split('.').pop().toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) return <FiFileText className="text-rose-500" />;
    if (['png', 'jpg', 'jpeg'].includes(extension)) return <FiImage className="text-teal-500" />;
    return <FiFile className="text-indigo-500" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading library...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <FiSearch />
          </div>
          <input 
            type="text" 
            placeholder="Search documents by title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 font-medium"
          />
        </div>

        {/* Subject Filter */}
        <div className="md:w-64 relative shrink-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <FiFilter />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-10 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 font-medium appearance-none cursor-pointer"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <FiBookOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-600 mb-2">No Resources Found</h3>
          <p className="text-slate-400 font-medium max-w-md mx-auto">
            {searchQuery 
              ? "No materials match your search criteria. Try a different keyword." 
              : "Your teachers haven't uploaded any study materials for your class yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div 
              key={material._id} 
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:shadow-indigo-600/10 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(material.fileUrl)}
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-indigo-100">
                    {material.subject}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {material.title}
                </h3>
                
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <FiUser className="text-slate-400" />
                    Uploaded by <span className="font-bold text-slate-700">{material.uploadedBy?.name || "Teacher"}</span>
                  </p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <FiClock className="text-slate-400" />
                    {new Date(material.createdAt).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <a 
                  href={material.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white border border-slate-200 hover:border-indigo-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <FiDownload /> Download File
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default StudentStudyMaterials;