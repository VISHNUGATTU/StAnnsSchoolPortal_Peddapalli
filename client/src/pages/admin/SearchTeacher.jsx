import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import { FiSearch, FiArrowLeft, FiUser, FiAlertCircle, FiMail, FiPhone, FiBriefcase, FiAward, FiCalendar, FiDownload } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const SearchTeacher = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [searchId, setSearchId] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(''); setTeacher(null);
    if (!searchId.trim()) { setSearchError("Please enter a Teacher ID."); return; }

    setLoadingSearch(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/teachers/all`, { withCredentials: true });
      if (data.success) {
        const found = data.teachers.find(t => t.teacherId.toLowerCase() === searchId.toLowerCase());
        if (found) setTeacher(found);
        else setSearchError(`No faculty record found for Teacher ID "${searchId}".`);
      }
    } catch (error) {
      setSearchError("Unable to connect to the server.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  // 1. Explicitly calculate standard base payroll values without any leave deductions
  let computedPayroll = {};
  if (teacher) {
    const p = teacher.payroll || {};
    const basic = parseFloat(p.basic) || 0;
    const da = parseFloat(p.da) || 0;
    const hra = parseFloat(p.hra) || 0;
    const ca = parseFloat(p.ca) || 0;
    const grossTotal = parseFloat(p.gross) || (basic + da + hra + ca);

    const mngEpf = grossTotal * 0.12;
    const mngEsi = grossTotal * 0.0325;
    const empEpf = grossTotal * 0.12;
    const empEsi = grossTotal * 0.0075;

    let profTax = 0;
    if (grossTotal > 15000 && grossTotal <= 20000) profTax = 150;
    else if (grossTotal > 20000) profTax = 200;

    const netAmount = grossTotal - empEpf - empEsi - profTax;

    computedPayroll = {
      ...p,
      gross: grossTotal,
      mngEpf: parseFloat(mngEpf.toFixed(2)),
      mngEsi: parseFloat(mngEsi.toFixed(2)),
      empEpf: parseFloat(empEpf.toFixed(2)),
      empEsi: parseFloat(empEsi.toFixed(2)),
      profTax: profTax,
      netAmount: parseFloat(netAmount.toFixed(2))
    };
  }

  // 2. Properly unpack attendance summary keys from backend
  const yearlyAttendance = teacher?.attendanceSummary?.yearly || { totalHalfDays: 0, absentHalfDays: 0, absentFullDays: 0 };
  const totalWorkingDays = yearlyAttendance.totalHalfDays || 0;
  const totalLeaves = (yearlyAttendance.absentHalfDays * 0.5) + (yearlyAttendance.absentFullDays || 0);
  const presentDays = Math.max(0, totalWorkingDays - totalLeaves);
  const attendancePercentage = totalWorkingDays > 0 ? Number(((presentDays / totalWorkingDays) * 100).toFixed(1)) : 100;

  const downloadProfilePDF = () => {
    if (!teacher) return;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text("ST. ANN'S HIGH SCHOOL", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); 
    doc.text("Rangampalli, Cheekurai Road, Peddapalli - 505174", 105, 27, { align: "center" });
    doc.text("Ph: 7989399783 | Email: stannshighschool1993@gmail.com", 105, 33, { align: "center" });
    doc.text("Web: stannshighschoolpeddapalli.com", 105, 39, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 46, 190, 46);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("FACULTY PROFILE REPORT", 105, 56, { align: "center" });

    let y = 70;

    const addSection = (title, items) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(title, 20, y);
      y += 2;
      doc.setLineWidth(0.2);
      doc.line(20, y, 190, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      items.forEach(item => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${item.label}:`, 20, y);
        doc.text(String(item.value || 'N/A'), 70, y);
        y += 7;
      });
      y += 5;
    };

    addSection("Identity & Credentials", [
      { label: "Teacher ID", value: teacher.teacherId },
      { label: "Full Name", value: teacher.name },
      { label: "Designation", value: teacher.designation },
      { label: "Email Address", value: teacher.mail },
      { label: "Phone Number", value: teacher.phno }
    ]);

    addSection("HR & Bank Details", [
      { label: "Qualification", value: computedPayroll.qualification },
      { label: "Date of Joining", value: formatDate(computedPayroll.dateOfJoining) },
      { label: "Perm. Appt. Date", value: formatDate(computedPayroll.dateOfPermanentAppt) },
      { label: "Scale Code", value: computedPayroll.scaleCode },
      { label: "Bank Name", value: computedPayroll.bankName },
      { label: "Account Number", value: computedPayroll.accountNumber },
      { label: "SGBT / SA", value: computedPayroll.sgbtSa }
    ]);

    addSection("Payroll Information", [
      { label: "Basic", value: `Rs. ${computedPayroll.basic || 0}` },
      { label: "DA", value: `Rs. ${computedPayroll.da || 0}` },
      { label: "HRA", value: `Rs. ${computedPayroll.hra || 0}` },
      { label: "CA", value: `Rs. ${computedPayroll.ca || 0}` },
      { label: "Scale", value: computedPayroll.scale },
      { label: "Gross Total", value: `Rs. ${computedPayroll.gross || 0}` },
      { label: "MNG EPF (12%)", value: `Rs. ${computedPayroll.mngEpf || 0}` },
      { label: "MNG ESI (3.25%)", value: `Rs. ${computedPayroll.mngEsi || 0}` },
      { label: "EMP EPF (12%)", value: `Rs. ${computedPayroll.empEpf || 0}` },
      { label: "EMP ESI (0.75%)", value: `Rs. ${computedPayroll.empEsi || 0}` },
      { label: "Prof Tax", value: `Rs. ${computedPayroll.profTax || 0}` },
      { label: "Net Amount", value: `Rs. ${computedPayroll.netAmount || 0}` }
    ]);

    addSection("Attendance Summary", [
      { label: "Total Working Days", value: totalWorkingDays },
      { label: "Days Present", value: presentDays },
      { label: "Percentage", value: `${attendancePercentage}%` }
    ]);

    if (y > 240) { doc.addPage(); y = 20; }
    y += 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Authorized Signatory", 150, y);
    doc.setLineWidth(0.5);
    doc.setDrawColor(15, 23, 42);
    doc.line(145, y - 7, 185, y - 7); 

    y += 20;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("This is an electronically generated profile report and does not require a physical signature.", 105, y, { align: "center" });

    doc.save(`Faculty_Profile_${teacher.teacherId}_${teacher.name.replace(/\s+/g, '_')}.pdf`);
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 font-medium text-sm">{label}:</span>
      <span className="font-bold text-slate-800 text-sm text-right w-1/2 break-words">{value || 'N/A'}</span>
    </div>
  );

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3"><FiSearch className="text-emerald-600" /> Faculty Directory</h1>
        </div>
        <button onClick={() => navigate('/admin/teachers')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-slate-50 shadow-sm"><FiArrowLeft /> Back</button>
      </div>

      <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Teacher ID</label>
            <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Enter Teacher ID" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-emerald-500" />
          </div>
          <button type="submit" disabled={loadingSearch} className="px-8 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 h-full">
            {loadingSearch ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiSearch /> Search</>}
          </button>
        </form>
        {searchError && <div className="mt-6 p-4 bg-rose-50 border-rose-100 rounded-xl flex items-start gap-3"><FiAlertCircle className="text-rose-500 mt-0.5" /><p className="text-rose-700 text-sm">{searchError}</p></div>}
      </div>

      {teacher && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
          <div className="h-32 bg-gradient-to-r from-emerald-600 to-emerald-800 relative">
            <div className="absolute top-4 right-6">
              <button onClick={downloadProfilePDF} className="bg-white text-emerald-800 font-bold px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                <FiDownload /> Download Profile
              </button>
            </div>
            <div className="absolute -bottom-12 left-8 flex items-end gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden">
                {teacher.image ? <img src={`${backendUrl}${teacher.image}`} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><FiUser size={40} className="text-slate-400" /></div>}
              </div>
              <div className="pb-2">
                <h2 className="text-3xl font-bold text-slate-900">{teacher.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">ID: {teacher.teacherId}</span>
                  <span className="px-3 py-1 bg-white text-emerald-800 text-xs font-bold rounded-full">{teacher.designation}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-slate-200 pb-2 mb-3">Identity & Credentials</h3>
              <InfoRow label="Teacher ID" value={teacher.teacherId} />
              <InfoRow label="Email" value={teacher.mail} />
              <InfoRow label="Phone" value={teacher.phno} />
              <InfoRow label="Designation" value={teacher.designation} />
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-slate-200 pb-2 mb-3">HR Details</h3>
              <InfoRow label="Qualification" value={computedPayroll.qualification} />
              <InfoRow label="Date of Joining" value={formatDate(computedPayroll.dateOfJoining)} />
              <InfoRow label="Permanent Appt." value={formatDate(computedPayroll.dateOfPermanentAppt)} />
              <InfoRow label="Scale Code" value={computedPayroll.scaleCode} />
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-slate-200 pb-2 mb-3">Bank Details</h3>
              <InfoRow label="Bank Name" value={computedPayroll.bankName} />
              <InfoRow label="Account No" value={computedPayroll.accountNumber} />
              <InfoRow label="Scale" value={computedPayroll.scale} />
              <InfoRow label="SGBT / SA" value={computedPayroll.sgbtSa} />
            </div>

            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-lg font-bold text-emerald-800 border-b pb-2">Payroll Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">Basic</p><p className="font-bold text-slate-800">₹{computedPayroll.basic || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">DA</p><p className="font-bold text-slate-800">₹{computedPayroll.da || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">HRA</p><p className="font-bold text-slate-800">₹{computedPayroll.hra || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">CA</p><p className="font-bold text-slate-800">₹{computedPayroll.ca || 0}</p></div>
                <div className="col-span-2"><p className="text-xs text-slate-500 mb-1 uppercase font-bold">Gross Amount</p><p className="font-bold text-emerald-600 text-lg">₹{computedPayroll.gross || 0}</p></div>
                
                <div className="col-span-2 md:col-span-4 lg:col-span-6 my-1 border-t border-slate-200"></div>
                
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">MNG EPF</p><p className="font-bold text-rose-500">₹{computedPayroll.mngEpf || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">MNG ESI</p><p className="font-bold text-rose-500">₹{computedPayroll.mngEsi || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">EMP EPF</p><p className="font-bold text-rose-500">₹{computedPayroll.empEpf || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">EMP ESI</p><p className="font-bold text-rose-500">₹{computedPayroll.empEsi || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">Prof Tax</p><p className="font-bold text-rose-500">₹{computedPayroll.profTax || 0}</p></div>
                <div><p className="text-xs text-slate-500 mb-1 uppercase font-bold">Net Amount</p><p className="font-black text-emerald-700 text-xl">₹{computedPayroll.netAmount || 0}</p></div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-lg font-bold text-emerald-800 border-b pb-2">Attendance Summary</h3>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Classes</p>
                  {/* 🚨 FIXED: Now maps to the correctly extracted variable */}
                  <p className="text-2xl font-black text-slate-800">{totalWorkingDays}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Classes Attended</p>
                  {/* 🚨 FIXED: Now maps to the correctly extracted variable */}
                  <p className="text-2xl font-black text-emerald-600">{presentDays}</p>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Attendance %</span>
                    {/* 🚨 FIXED: Now maps to the correctly extracted variable */}
                    <span className="text-sm font-bold text-emerald-600">{attendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SearchTeacher;