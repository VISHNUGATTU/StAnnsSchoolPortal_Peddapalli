import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiDollarSign, FiSave, FiSettings, FiRefreshCw } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const FeeStructure = () => {
  const { backendUrl } = useAppContext();
  
  const [feeData, setFeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    grade: '1',
    tuitionFee: '',
    facilityFee: ''
  });

  const fetchFeeStructures = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/fees/structure`, {
        withCredentials: true
      });
      if (data.success) {
        setFeeData(data.fees);
      }
    } catch (error) {
      toast.error("Failed to load current fee structures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
    // eslint-disable-next-line
  }, []);

  // When a grade is selected, populate the form with existing data if it exists
  const handleGradeChange = (e) => {
    const selectedGrade = e.target.value;
    const existingFee = feeData.find(f => f.grade === selectedGrade);
    
    if (existingFee) {
      setFormData({
        grade: selectedGrade,
        tuitionFee: existingFee.tuitionFee,
        facilityFee: existingFee.facilityFee
      });
    } else {
      setFormData({
        grade: selectedGrade,
        tuitionFee: '',
        facilityFee: ''
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/fees/structure/set`, formData, {
        withCredentials: true
      });

      if (data.success) {
        toast.success(data.message);
        fetchFeeStructures(); // Refresh the grid
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update fee structure.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
          <FiSettings className="text-emerald-600" /> Fee Master Configuration
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Define the base tuition and facility costs for each academic class.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Update Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 sticky top-6">
            <h3 className="text-xl font-serif font-bold text-navy border-l-4 border-emerald-500 pl-3 mb-6">Set Class Fee</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Grade/Class</label>
                <select 
                  name="grade" 
                  value={formData.grade}
                  onChange={handleGradeChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-navy font-bold"
                >
                  {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Tuition Fee (₹) *</label>
                <input 
                  type="number" 
                  name="tuitionFee"
                  required
                  min="0"
                  value={formData.tuitionFee}
                  onChange={handleInputChange}
                  placeholder="e.g. 45000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-navy font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Facility / Other Fees (₹)</label>
                <input 
                  type="number" 
                  name="facilityFee"
                  min="0"
                  value={formData.facilityFee}
                  onChange={handleInputChange}
                  placeholder="e.g. 5000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-navy font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-500 uppercase">Calculated Total</span>
                  <span className="text-xl font-black text-emerald-600">
                    ₹{((Number(formData.tuitionFee) || 0) + (Number(formData.facilityFee) || 0)).toLocaleString()}
                  </span>
                </div>
                
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                  {saving ? 'Updating...' : 'Lock Fee Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Current Structures Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/40 h-full">
            <h3 className="text-xl font-serif font-bold text-navy flex items-center gap-2 mb-6">
              <FiDollarSign className="text-emerald-500" /> Active Fee Configurations
            </h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <FiRefreshCw className="animate-spin text-3xl text-emerald-500" />
              </div>
            ) : feeData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="font-medium">No fee structures have been defined yet.</p>
                <p className="text-sm mt-1">Use the panel on the left to set up class fees.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feeData.map((fee) => (
                  <div key={fee._id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-200 transition-colors">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                      <span className="font-bold text-navy text-lg">Class {fee.grade}</span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">Active</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Base Tuition</span>
                        <span className="font-bold text-slate-700">₹{fee.tuitionFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Facility/Other</span>
                        <span className="font-bold text-slate-700">₹{fee.facilityFee.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 border-dashed">
                      <span className="text-xs font-bold text-slate-400 uppercase">Total Yearly Fee</span>
                      <span className="font-black text-emerald-600 text-lg">₹{fee.totalFee.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FeeStructure;