import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FiDollarSign, FiDownload, FiRefreshCw, FiAlertCircle, FiLock } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext'; 

const SalaryManagement = () => {
  const { backendUrl } = useAppContext();
  
  const [viewMode, setViewMode] = useState('monthly'); 
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [resetModal, setResetModal] = useState({ isOpen: false, type: '', password: '', processing: false });

  // 🚨 NEW: Refs for synchronized scrolling
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);

  const fetchReports = async () => {
    setLoading(true);
    setReports([]); 
    
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/salaries/reports`, {
        params: { month, year, type: viewMode },
        withCredentials: true
      });
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      toast.error("Failed to load salary reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [viewMode, month, year]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetModal.password) return toast.error("Password required");
    
    setResetModal({ ...resetModal, processing: true });
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/salaries/reset`, {
        type: resetModal.type,
        password: resetModal.password
      }, { withCredentials: true });

      if (data.success) {
        toast.success(data.message);
        setResetModal({ isOpen: false, type: '', password: '', processing: false });
        fetchReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
      setResetModal({ ...resetModal, processing: false });
    }
  };

  const exportExcel = () => {
    if (reports.length === 0) return toast.error("No data to export");
    
    let wsData = [];
    if (viewMode === 'monthly') {
      wsData = reports.map(r => ({
        "Teacher ID": r.teacherId, "Name": r.name, "Designation": r.designation,
        "Half Days": r.leaves?.half || 0, "Full Days": r.leaves?.full || 0, "Total Leaves": r.leaves?.total || 0,
        "Gross (Rs)": r.salary?.grossTotal || 0, "Loss of Pay (Rs)": r.salary?.lossOfPay || 0, "Total (Rs)": r.salary?.calculatedTotal || 0,
        "MNG EPF": r.salary?.mngEpf || 0, "MNG ESI": r.salary?.mngEsi || 0, "EMP EPF": r.salary?.empEpf || 0, "EMP ESI": r.salary?.empEsi || 0,
        "Prof Tax": r.salary?.profTax || 0, "Net Salary": r.salary?.netAmount || 0
      }));
    } else {
      reports.forEach(t => {
        wsData.push({ "Teacher ID": t.teacherId, "Name": t.name, "Designation": t.designation, "Period": "---", "Net Salary": "---" });
        t.monthlyBreakdown?.forEach(m => {
            wsData.push({
                "Teacher ID": "", "Name": "", "Designation": "", "Period": m.period,
                "Half Days": m.leaves?.half || 0, "Full Days": m.leaves?.full || 0, "Total Leaves": m.leaves?.total || 0,
                "Gross (Rs)": m.salary?.grossTotal || 0, "Loss of Pay (Rs)": m.salary?.lossOfPay || 0, "Total (Rs)": m.salary?.calculatedTotal || 0,
                "MNG EPF": m.salary?.mngEpf || 0, "MNG ESI": m.salary?.mngEsi || 0, "EMP EPF": m.salary?.empEpf || 0, "EMP ESI": m.salary?.empEsi || 0,
                "Prof Tax": m.salary?.profTax || 0, "Net Salary": m.salary?.netAmount || 0
            });
        });
        wsData.push({ "Teacher ID": "", "Name": "TOTAL ANNUAL NET", "Designation": "", "Period": "", "Net Salary": t.yearlyTotals?.netAmount || 0 });
        wsData.push({});
      });
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${viewMode} Salary Report`);
    XLSX.writeFile(wb, `Salary_Report_${viewMode}_${year}.xlsx`);
  };

  const exportPDF = () => {
    if (reports.length === 0) return toast.error("No data to export");
    const doc = new jsPDF('landscape');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text("ST. ANN'S HIGH SCHOOL", 148.5, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); 
    doc.text("Rangampalli, Cheekurai Road, Peddapalli - 505174", 148.5, 27, { align: "center" });
    doc.text("Ph: 7989399783 | Email: stannshighschool1993@gmail.com", 148.5, 33, { align: "center" });
    doc.text("Web: stannshighschoolpeddapalli.com", 148.5, 39, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 46, 283, 46);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`FACULTY ${viewMode.toUpperCase()} SALARY REPORT - ${viewMode === 'monthly' ? month + '/' : ''}${year}`, 148.5, 56, { align: "center" });

    const tableColumn = viewMode === 'monthly' 
      ? ["ID", "Name", "Leaves", "Gross", "LOP", "Calc Total", "M-EPF", "M-ESI", "E-EPF", "E-ESI", "PT", "Net Amount"]
      : ["ID / Period", "Teacher / Summary", "Leaves", "Gross", "LOP", "Calc Total", "M-EPF", "M-ESI", "E-EPF", "E-ESI", "PT", "Net Amount"];
      
    const tableRows = [];
    
    if (viewMode === 'monthly') {
      reports.forEach(r => {
        tableRows.push([
          r.teacherId, r.name, r.leaves?.total || 0, (r.salary?.grossTotal || 0).toFixed(0), (r.salary?.lossOfPay || 0).toFixed(0), 
          (r.salary?.calculatedTotal || 0).toFixed(0), (r.salary?.mngEpf || 0).toFixed(0), (r.salary?.mngEsi || 0).toFixed(0), 
          (r.salary?.empEpf || 0).toFixed(0), (r.salary?.empEsi || 0).toFixed(0), r.salary?.profTax || 0, (r.salary?.netAmount || 0).toFixed(0)
        ]);
      });
    } else {
      reports.forEach(t => {
        tableRows.push([t.teacherId, `${t.name} (${t.designation})`, "", "", "", "", "", "", "", "", "", ""]);
        t.monthlyBreakdown?.forEach(m => {
            tableRows.push([
                m.period, "", m.leaves?.total || 0, (m.salary?.grossTotal || 0).toFixed(0), (m.salary?.lossOfPay || 0).toFixed(0), 
                (m.salary?.calculatedTotal || 0).toFixed(0), (m.salary?.mngEpf || 0).toFixed(0), (m.salary?.mngEsi || 0).toFixed(0), 
                (m.salary?.empEpf || 0).toFixed(0), (m.salary?.empEsi || 0).toFixed(0), m.salary?.profTax || 0, (m.salary?.netAmount || 0).toFixed(0)
            ]);
        });
        tableRows.push(["", "TOTAL ANNUAL NET", "", "", "", "", "", "", "", "", "", (t.yearlyTotals?.netAmount || 0).toFixed(0)]);
      });
    }

    doc.autoTable({
      head: [tableColumn], body: tableRows, startY: 65,
      styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [15, 23, 42] }
    });
    
    let finalY = doc.lastAutoTable.finalY + 25;
    if (finalY > 190) { doc.addPage(); finalY = 30; }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Authorized Signatory", 240, finalY);
    doc.setLineWidth(0.5);
    doc.setDrawColor(15, 23, 42);
    doc.line(230, finalY - 7, 280, finalY - 7); 

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("This is an electronically generated salary report and does not require a physical signature.", 148.5, finalY + 15, { align: "center" });
    
    doc.save(`Salary_Report_${viewMode}_${year}.pdf`);
  };

  // 🚨 NEW: Synchronized scroll handlers
  const handleTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3">
            <FiDollarSign className="text-emerald-600" /> Salary Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Automated payroll, leave deduction, and tax generation.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold shadow-sm">
            <FiDownload /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold shadow-sm">
            <FiDownload /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setViewMode('monthly')} className={`px-6 py-2.5 font-bold text-sm transition-colors ${viewMode === 'monthly' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Monthly View</button>
            <button onClick={() => setViewMode('cumulative')} className={`px-6 py-2.5 font-bold text-sm transition-colors border-l border-slate-200 ${viewMode === 'cumulative' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Cumulative (Yearly)</button>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'monthly' && (
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none">
                {Array.from({ length: 12 }, (_, i) => (<option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>))}
              </select>
            )}
            
            <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none">
              {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            
            <button onClick={() => setResetModal({ isOpen: true, type: viewMode, password: '', processing: false })} className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-bold border border-rose-200 hover:bg-rose-200 ml-4">
              <FiRefreshCw /> Reset {viewMode}
            </button>
          </div>
        </div>

        {/* 🚨 NEW: Floating Top Scrollbar perfectly synced to the table below */}
        <div 
          ref={topScrollRef} 
          onScroll={handleTopScroll} 
          className="overflow-x-auto w-full custom-scrollbar bg-slate-50"
        >
          <div className="min-w-[1200px] h-[1px]"></div>
        </div>

        <div 
          ref={tableScrollRef} 
          onScroll={handleTableScroll} 
          className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar bg-white p-1"
        >
          {loading ? (
             <div className="p-16 text-center">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-500 font-bold">Calculating Payroll...</p>
             </div>
          ) : reports.length === 0 ? (
             <div className="p-16 text-center text-slate-500 font-medium">No payroll data found for selected period.</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {viewMode === 'monthly' ? 'Teacher Details' : 'Period / Teacher'}
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Leaves (H / F / T)</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Gross</th>
                  <th className="p-4 text-[10px] font-black text-rose-500 uppercase tracking-wider text-right bg-rose-50/50">Loss of Pay</th>
                  <th className="p-4 text-[10px] font-black text-slate-700 uppercase tracking-wider text-right">Total</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center border-l border-r border-slate-200">M-EPF / M-ESI</th>
                  <th className="p-4 text-[10px] font-black text-rose-600 uppercase tracking-wider text-center border-r border-slate-200">E-EPF / E-ESI / PT</th>
                  <th className="p-4 text-[10px] font-black text-emerald-600 uppercase tracking-wider text-right bg-emerald-50/50">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {viewMode === 'monthly' && reports.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-navy">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.teacherId} • {r.designation}</p>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-600">
                      {r.leaves?.half || 0} / {r.leaves?.full || 0} / <span className="text-rose-500">{r.leaves?.total || 0}</span>
                    </td>
                    <td className="p-4 text-right font-medium">₹{(r.salary?.grossTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="p-4 text-right font-bold text-rose-600 bg-rose-50/20">-₹{(r.salary?.lossOfPay || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="p-4 text-right font-black text-slate-700">₹{(r.salary?.calculatedTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="p-4 text-center text-xs font-medium border-l border-r border-slate-100">
                      {(r.salary?.mngEpf || 0).toFixed(1)} / {(r.salary?.mngEsi || 0).toFixed(1)}
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-rose-500 border-r border-slate-100">
                      {(r.salary?.empEpf || 0).toFixed(1)} / {(r.salary?.empEsi || 0).toFixed(1)} / {r.salary?.profTax || 0}
                    </td>
                    <td className="p-4 text-right font-black text-emerald-600 text-lg bg-emerald-50/20">
                      ₹{(r.salary?.netAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}

                {viewMode === 'cumulative' && reports.map((teacher, tIdx) => {
                  if (!teacher.monthlyBreakdown) return null; 
                  return (
                    <React.Fragment key={tIdx}>
                      <tr className="bg-slate-100 border-t-2 border-b border-slate-200">
                        <td colSpan="8" className="p-3">
                          <p className="font-bold text-navy text-sm">{teacher.name} <span className="text-xs text-slate-500 font-normal ml-2">{teacher.teacherId} • {teacher.designation}</span></p>
                        </td>
                      </tr>
                      
                      {teacher.monthlyBreakdown.map((m, mIdx) => (
                        <tr key={`row-${tIdx}-${mIdx}`} className="hover:bg-slate-50 transition-colors text-sm">
                          <td className="p-3 pl-6 font-medium text-slate-600">{m.period}</td>
                          <td className="p-3 text-center font-bold text-slate-600">
                            {m.leaves?.half || 0} / {m.leaves?.full || 0} / <span className="text-rose-500">{m.leaves?.total || 0}</span>
                          </td>
                          <td className="p-3 text-right font-medium">₹{(m.salary?.grossTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="p-3 text-right font-bold text-rose-600 bg-rose-50/20">-₹{(m.salary?.lossOfPay || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="p-3 text-right font-black text-slate-700">₹{(m.salary?.calculatedTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="p-3 text-center text-xs font-medium border-l border-r border-slate-100">
                            {(m.salary?.mngEpf || 0).toFixed(1)} / {(m.salary?.mngEsi || 0).toFixed(1)}
                          </td>
                          <td className="p-3 text-center text-xs font-bold text-rose-500 border-r border-slate-100">
                            {(m.salary?.empEpf || 0).toFixed(1)} / {(m.salary?.empEsi || 0).toFixed(1)} / {m.salary?.profTax || 0}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-600 bg-emerald-50/20">
                            ₹{(m.salary?.netAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                      
                      <tr className="bg-slate-50 border-b-2 border-slate-300">
                        <td colSpan="7" className="p-3 text-right font-black text-slate-700 uppercase tracking-wider text-xs">
                          Total Annual Net for {teacher.name}
                        </td>
                        <td className="p-3 text-right font-black text-indigo-700 text-lg bg-indigo-50/30">
                          ₹{(teacher.yearlyTotals?.netAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReset} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in border border-slate-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <FiAlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-navy text-center mb-2">Reset {resetModal.type} Data?</h2>
            <p className="text-sm text-slate-500 text-center mb-8">This will irreversibly wipe all {resetModal.type} leave logs and payroll generations for all teachers.</p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><FiLock /> Master Admin Password</label>
              <input type="password" required value={resetModal.password} onChange={(e) => setResetModal({...resetModal, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 font-medium" placeholder="Authenticate to proceed..." />
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setResetModal({ isOpen: false, type: '', password: '', processing: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
              <button type="submit" disabled={resetModal.processing} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700">
                {resetModal.processing ? 'Wiping...' : 'Confirm Reset'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default SalaryManagement;