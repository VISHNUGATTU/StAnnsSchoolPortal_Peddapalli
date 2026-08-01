import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiCreditCard, FiSearch, FiUser, FiAlertCircle, 
  FiCheckCircle, FiClock, FiFileText, FiArrowLeft, FiDownload 
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';
import jsPDF from 'jspdf'; 

const FeePayment = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [searchAdno, setSearchAdno] = useState('');
  const [searchParams, setSearchParams] = useState({
    grade: '1',
    section: 'A',
    rollno: ''
  });
  
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [student, setStudent] = useState(null);
  const [searchError, setSearchError] = useState('');
  
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    remarks: ''
  });

  const handleSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    if (searchError) setSearchError('');
  };

  const handlePaymentChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  // ==========================================
  // 📄 OFFICIAL ST. ANN'S PDF GENERATION
  // ==========================================
  const generateReceiptPDF = (receipt) => {
    const doc = new jsPDF();

    // 1. Official School Header (From Provided Image)
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

    // Divider Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 46, 190, 46);

    // 2. Receipt Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("FEE PAYMENT RECEIPT", 105, 56, { align: "center" });

    // 3. Transaction Details (Date & Time)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Receipt No: `, 20, 70);
    doc.setFont("helvetica", "normal");
    doc.text(receipt.receiptNumber, 45, 70);

    const txDate = new Date(receipt.date);
    const dateStr = txDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = txDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    doc.setFont("helvetica", "bold");
    doc.text(`Date & Time: `, 130, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`${dateStr} | ${timeStr}`, 154, 70);

    // 4. Student Information Box
    doc.setDrawColor(15, 23, 42); 
    doc.setLineWidth(0.3);
    doc.rect(20, 78, 170, 30); // x, y, width, height

    doc.setFont("helvetica", "bold");
    doc.text("Student Information", 25, 86);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Name            :   ${receipt.studentName}`, 25, 95);
    doc.text(`Class/Sec      :   ${receipt.classDetails}`, 120, 95);
    doc.text(`Admn No       :   ${receipt.admissionNo || 'N/A'}`, 25, 103);

    // 5. Payment Information Box
    doc.rect(20, 115, 170, 40);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Information", 25, 123);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Amount Paid          :   Rs. ${Number(receipt.amountPaid).toLocaleString()}`, 25, 133);
    doc.text(`Mode of Payment :   ${receipt.paymentMethod}`, 25, 141);

    if (receipt.remainingBalance !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`Remaining Due      :   Rs. ${Number(receipt.remainingBalance).toLocaleString()}`, 25, 149);
      doc.setFont("helvetica", "normal");
    } else {
      doc.text(`Remaining Due      :   N/A`, 25, 149);
    }

    // 6. Footer & Signatures
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", 150, 185);
    doc.setLineWidth(0.5);
    doc.setDrawColor(15, 23, 42);
    doc.line(145, 178, 185, 178); // Signature Line

    // Bottom System Text
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("This is an electronically generated receipt and does not require a physical signature.", 105, 205, { align: "center" });
    doc.text("Thank you for your payment.", 105, 211, { align: "center" });

    // Save PDF
    doc.save(`Fee_Receipt_${receipt.receiptNumber}.pdf`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setStudent(null);

    let queryParams = {};
    if (searchAdno.trim()) {
      queryParams.adno = searchAdno.trim();
    } else if (searchParams.rollno.trim()) {
      queryParams = searchParams;
    } else {
      setSearchError("Please enter an ADNO or Roll Number.");
      return;
    }

    setLoadingSearch(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/fees/student`, {
        params: queryParams,
        withCredentials: true
      });

      if (data.success && data.student) {
        setStudent(data.student);
        setPaymentData({ amount: '', paymentMethod: 'Cash', remarks: '' });
      } else {
        setSearchError(`No record found for the provided details.`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSearchError(`No student found. Please check the ID or Roll Number.`);
      } else {
        setSearchError("Unable to connect to the server.");
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    const amountToPay = Number(paymentData.amount);
    if (!amountToPay || amountToPay <= 0) {
      return toast.error("Please enter a valid payment amount.");
    }
    
    if (amountToPay > student.feeDetails.dueAmount) {
      return toast.error(`Amount cannot exceed the due balance of ₹${student.feeDetails.dueAmount}`);
    }

    setLoadingPayment(true);
    try {
      const payload = {
        studentId: student._id,
        amount: amountToPay,
        paymentMethod: paymentData.paymentMethod,
        remarks: paymentData.remarks
      };

      const { data } = await axios.post(`${backendUrl}/api/admin/fees/pay`, payload, {
        withCredentials: true
      });

      if (data.success) {
        toast.success(`Payment recorded! Downloading receipt...`);
        setStudent(data.updatedStudent); 
        setPaymentData({ amount: '', paymentMethod: 'Cash', remarks: '' });

        if (data.receiptData) {
          generateReceiptPDF(data.receiptData);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process payment");
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleDownloadHistoricalReceipt = (txn) => {
    const historicalReceipt = {
      receiptNumber: txn.remarks?.startsWith('TXN') ? txn.remarks : `TXN-${new Date(txn.date).getTime()}`,
      date: txn.date,
      studentName: student.name,
      admissionNo: student.adno,
      classDetails: `Class ${student.grade} - ${student.section}`,
      amountPaid: txn.amount,
      paymentMethod: txn.method,
      remainingBalance: "N/A"
    };
    generateReceiptPDF(historicalReceipt);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3">
            <FiCreditCard className="text-emerald-600" /> Fee Collection
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Process payments and download PDF receipts.</p>
        </div>
        <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm shrink-0">
          <FiArrowLeft /> Dashboard
        </button>
      </div>

      <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6 items-end">
          
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Search by ADNO</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400"><FiSearch /></div>
              <input type="text" value={searchAdno} onChange={(e) => { setSearchAdno(e.target.value); setSearchError(''); }} placeholder="Enter Admission Number" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div className="flex items-center justify-center font-bold text-slate-300 md:pb-3">- OR -</div>

          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Grade</label>
              <select name="grade" value={searchParams.grade} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500">
                {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => <option key={g} value={g}>Class {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Section</label>
              <select name="section" value={searchParams.section} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500">
                {["A", "B", "C", "D"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Roll No</label>
              <input type="text" name="rollno" value={searchParams.rollno} onChange={handleSearchChange} placeholder="Roll Number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" />
            </div>
          </div>

          <button type="submit" disabled={loadingSearch} className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 h-[48px] shadow-lg flex items-center justify-center gap-2 w-full md:w-auto">
            {loadingSearch ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiSearch /> Fetch</>}
          </button>
        </form>
        {searchError && <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-700 text-sm font-medium"><FiAlertCircle className="mt-0.5" />{searchError}</div>}
      </div>

      {student && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {student.image ? <img src={`${backendUrl}${student.image}`} alt={student.name} className="w-full h-full object-cover" /> : <FiUser size={32} className="text-slate-400" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-navy">{student.name}</h2>
                  <p className="text-slate-500 font-medium mt-1">ADNO: {student.adno || 'N/A'} <span className="mx-2">|</span> Class {student.grade}-{student.section} <span className="mx-2">|</span> Roll: {student.rollno}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 divide-x divide-slate-100 p-2">
                <div className="p-6 text-center"><p className="text-sm font-bold text-slate-400 uppercase">Total Fee</p><p className="text-2xl font-black text-navy">₹{student.feeDetails?.totalAmount?.toLocaleString() || 0}</p></div>
                <div className="p-6 text-center"><p className="text-sm font-bold text-emerald-600 uppercase">Paid</p><p className="text-2xl font-black text-emerald-600">₹{student.feeDetails?.paidAmount?.toLocaleString() || 0}</p></div>
                <div className="p-6 text-center bg-rose-50/30"><p className="text-sm font-bold text-rose-500 uppercase">Due Balance</p><p className="text-2xl font-black text-rose-600">₹{student.feeDetails?.dueAmount?.toLocaleString() || 0}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-navy flex items-center gap-2 mb-6"><FiClock className="text-slate-400" /> Transaction History</h3>
              
              {!student.feeHistory || student.feeHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p className="font-medium">No previous transactions found.</p></div>
              ) : (
                <div className="space-y-4">
                  {student.feeHistory.map((txn, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><FiCheckCircle /></div>
                        <div>
                          <p className="font-bold text-navy">₹{txn.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{txn.method} • {formatDate(txn.date)}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDownloadHistoricalReceipt(txn)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm"
                      >
                        <FiDownload /> Receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 sticky top-6">
              <h3 className="text-xl font-bold text-navy border-l-4 border-emerald-500 pl-3 mb-6">Record Payment</h3>
              
              {student.feeDetails?.dueAmount === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <FiCheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-emerald-700">Fully Paid</h4>
                </div>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount to Pay (₹) *</label>
                    <input type="number" name="amount" required min="1" max={student.feeDetails?.dueAmount} value={paymentData.amount} onChange={handlePaymentChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-navy font-bold text-lg" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Method *</label>
                    <select name="paymentMethod" value={paymentData.paymentMethod} onChange={handlePaymentChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-navy font-medium">
                      <option value="Cash">Cash</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="UPI">UPI / QR Scan</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                      {/* 🚨 ADDED: Concession option for waivers */}
                      <option value="Concession">Concession / Waiver</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Remarks</label>
                    <textarea name="remarks" rows="2" value={paymentData.remarks} onChange={handlePaymentChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-navy resize-none"></textarea>
                  </div>

                  <button type="submit" disabled={loadingPayment} className="w-full mt-2 py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 text-lg">
                    {loadingPayment ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiCheckCircle />} Confirm & Download PDF
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeePayment;