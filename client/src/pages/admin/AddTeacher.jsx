import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUserPlus, FiSave, FiArrowLeft, FiUploadCloud } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AddTeacher = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null);

  const [formData, setFormData] = useState({
    teacherId: '', name: '', mail: '', password: '', designation: '', phno: '',
  });

  const [payroll, setPayroll] = useState({
    bankName: '', accountNumber: '', qualification: '', qualificationOther: '',
    dateOfJoining: '', dateOfPermanentAppt: '', scaleCode: '', sgbtSa: '', scale: '',
    basic: '', da: '', hra: '', ca: '', gross: ''
  });

  const filterInput = (name, value) => {
    if (name === 'phno') return value.replace(/\D/g, '').slice(0, 10);
    if (['accountNumber'].includes(name)) return value.replace(/\D/g, '');
    if (['name', 'designation', 'bankName'].includes(name)) return value.replace(/[^a-zA-Z\s]/g, '');
    return value;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: filterInput(e.target.name, e.target.value) });

  const handlePayroll = (e) => {
    const { name, value } = e.target;
    let newPayroll = { ...payroll, [name]: filterInput(name, value) };

    if (name === 'basic') {
      const basicVal = parseFloat(value) || 0;
      newPayroll.da = (basicVal * 0.15).toFixed(2);
      newPayroll.hra = (basicVal * 0.05).toFixed(2);
    }

    if (['basic', 'da', 'hra', 'ca'].includes(name) || name === 'basic') {
      const basic = parseFloat(newPayroll.basic) || 0;
      const da = parseFloat(newPayroll.da) || 0;
      const hra = parseFloat(newPayroll.hra) || 0;
      const ca = parseFloat(newPayroll.ca) || 0;
      newPayroll.gross = (basic + da + hra + ca).toFixed(2);
    }

    setPayroll(newPayroll);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
      if (image) submitData.append('image', image);

      const finalPayroll = {
        ...payroll,
        qualification: payroll.qualification === 'Other' ? payroll.qualificationOther : payroll.qualification
      };
      submitData.append('payroll', JSON.stringify(finalPayroll));

      const { data } = await axios.post(`${backendUrl}/api/teacher/add`, submitData, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Teacher registered successfully!');
        navigate('/admin/teachers');
      } else toast.error(data.message || 'Failed to add teacher');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm font-medium";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider";
  const sectionHeader = "text-lg font-serif font-bold text-navy border-l-4 border-emerald-500 pl-3 mb-4 mt-6";

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3">
            <FiUserPlus className="text-emerald-600" /> Register Teacher Profile
          </h1>
        </div>
        <button onClick={() => navigate('/admin/teachers')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm">
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl">
        
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
            {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <FiUploadCloud className="text-3xl text-slate-400" />}
            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div><h3 className="font-bold text-navy">Faculty Photograph</h3><p className="text-sm text-slate-500">Optional. Max size 2MB.</p></div>
        </div>

        <h3 className={sectionHeader}>Identity & Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className={labelClass}>Teacher ID *</label><input type="text" name="teacherId" required value={formData.teacherId} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>Full Name *</label><input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>Designation *</label><input type="text" name="designation" required value={formData.designation} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>Email Address *</label><input type="email" name="mail" required value={formData.mail} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>Portal Password *</label><input type="password" name="password" required value={formData.password} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>Phone Number *</label><input type="text" name="phno" required maxLength={10} value={formData.phno} onChange={handleChange} className={inputClass} /></div>
        </div>

        <h3 className={sectionHeader}>HR & Bank Details (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div><label className={labelClass}>Qualification</label>
            <select name="qualification" value={payroll.qualification} onChange={handlePayroll} className={inputClass}>
              <option value="">Select</option><option value="B.Ed">B.Ed</option><option value="M.Ed">M.Ed</option><option value="B.Sc">B.Sc</option><option value="M.Sc">M.Sc</option><option value="M.A">M.A</option><option value="Other">Other</option>
            </select>
            {payroll.qualification === 'Other' && <input type="text" name="qualificationOther" placeholder="Specify..." value={payroll.qualificationOther} onChange={handlePayroll} className={`mt-2 ${inputClass} border-emerald-500`} />}
          </div>
          <div><label className={labelClass}>Date of Joining</label><input type="date" name="dateOfJoining" value={payroll.dateOfJoining} onChange={handlePayroll} className={inputClass} /></div>
          <div><label className={labelClass}>Permanent Appt. Date</label><input type="date" name="dateOfPermanentAppt" value={payroll.dateOfPermanentAppt} onChange={handlePayroll} className={inputClass} /></div>
          <div><label className={labelClass}>Scale Code</label><input type="text" name="scaleCode" value={payroll.scaleCode} onChange={handlePayroll} className={inputClass} /></div>
          <div><label className={labelClass}>Bank Name</label><input type="text" name="bankName" value={payroll.bankName} onChange={handlePayroll} className={inputClass} /></div>
          <div className="md:col-span-2"><label className={labelClass}>Account Number</label><input type="text" name="accountNumber" value={payroll.accountNumber} onChange={handlePayroll} className={inputClass} /></div>
          <div><label className={labelClass}>SGBT / SA</label><input type="text" name="sgbtSa" value={payroll.sgbtSa} onChange={handlePayroll} className={inputClass} /></div>
        </div>

        <h3 className={sectionHeader}>Payroll Information (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div><label className={labelClass}>Scale</label><input type="text" name="scale" value={payroll.scale} onChange={handlePayroll} className={inputClass} /></div>
          <div><label className={labelClass}>Basic (₹)</label><input type="text" name="basic" value={payroll.basic} onChange={handlePayroll} className={inputClass} /></div>
          <div><label className={labelClass}>DA (15%)</label><input type="text" name="da" value={payroll.da} readOnly className={`${inputClass} bg-slate-100`} /></div>
          <div><label className={labelClass}>HRA (5%)</label><input type="text" name="hra" value={payroll.hra} readOnly className={`${inputClass} bg-slate-100`} /></div>
          <div><label className={labelClass}>CA (₹)</label><input type="text" name="ca" value={payroll.ca} onChange={handlePayroll} className={inputClass} /></div>
          <div><label className={labelClass}>Gross Total (₹)</label><input type="text" name="gross" value={payroll.gross} readOnly className={`${inputClass} border-emerald-500 font-bold bg-white`} /></div>
        </div>

        <div className="pt-6 mt-6 flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/teachers')} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
          <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            {loading ? 'Saving...' : <><FiSave /> Register Teacher</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeacher;