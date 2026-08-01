import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCreditCard, FiCheckCircle, FiAlertCircle, 
  FiClock, FiDollarSign, FiFileText, FiShield
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const StudentFees = () => {
  const { backendUrl } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [feeData, setFeeData] = useState({
    feeDetails: { totalAmount: 0, paidAmount: 0, dueAmount: 0 },
    feeHistory: []
  });

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/student/fees`, { 
          withCredentials: true 
        });
        
        if (data.success) {
          setFeeData({
            feeDetails: data.feeDetails,
            feeHistory: data.feeHistory
          });
        }
      } catch (error) {
        toast.error("Failed to load fee details.");
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading financial records...</p>
      </div>
    );
  }

  const { totalAmount, paidAmount, dueAmount } = feeData.feeDetails;
  const history = feeData.feeHistory;
  
  // Calculate Progress Percentage safely
  const progressPercentage = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 100;
  const isCleared = dueAmount <= 0;

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans pb-12 mt-4">

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiDollarSign /> Total Academic Fee</p>
            <h3 className="text-3xl font-black text-slate-800">₹{totalAmount.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiCheckCircle /> Total Paid</p>
            <h3 className="text-3xl font-black text-emerald-600">₹{paidAmount.toLocaleString()}</h3>
          </div>
        </div>

        <div className={`rounded-3xl p-6 border shadow-sm flex items-center justify-between ${isCleared ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100 shadow-rose-500/10'}`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1 ${isCleared ? 'text-emerald-600' : 'text-rose-500'}`}>
              {isCleared ? <FiCheckCircle /> : <FiAlertCircle />} Outstanding Dues
            </p>
            <h3 className={`text-3xl font-black ${isCleared ? 'text-emerald-700' : 'text-rose-600'}`}>
              ₹{dueAmount.toLocaleString()}
            </h3>
          </div>
        </div>

      </div>

      {/* Progress Bar Widget */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-900/20 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex-1 w-full relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h4 className="text-white font-bold text-lg mb-0.5">Payment Progress</h4>
              <p className="text-indigo-200 text-xs font-medium">Track your fee clearance for the current academic year.</p>
            </div>
            <span className="text-2xl font-black text-white">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${isCleared ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="shrink-0 relative z-10 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 w-full md:w-auto text-center md:text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex justify-center md:justify-start items-center gap-1.5 mb-1">
            <FiShield /> Account Status
          </p>
          {isCleared ? (
             <p className="text-emerald-400 font-bold text-sm">Clearance Granted</p>
          ) : (
             <p className="text-rose-400 font-bold text-sm">Payment Pending</p>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
        
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800">Transaction History</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Official records of all your fee payments.
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FiFileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Transactions Found</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto">
              You haven't made any fee payments yet for this academic year.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            {history.map((transaction, index) => (
              <div 
                key={index} 
                className="p-5 md:p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                    <FiCheckCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">
                      ₹{transaction.amount?.toLocaleString()}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">
                        {transaction.method || "Cash"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock /> 
                        {new Date(transaction.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 italic">
                    "{transaction.remarks || "Fee installment paid"}"
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                    Collected by: {transaction.collectedBy || "Administration"}
                  </p>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentFees;