import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiEdit, FiSave, FiArrowLeft, FiSearch, FiAlertCircle, FiUploadCloud } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const standardQuals = ["B.Ed", "M.Ed", "B.Sc", "M.Sc", "M.A"];

const UpdateTeacher = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [searchId, setSearchId] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [teacherFound, setTeacherFound] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null);

  const [formData, setFormData] = useState({});
  const [payroll, setPayroll] = useState({});

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

  const getQualState = (val) => {
    if (!val) return { qual: '', other: '' };
    return standardQuals.includes(val) ? { qual: val, other: '' } : { qual: 'Other', other: val };
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(''); setTeacherFound(false);

    if (!searchId.trim()) { setSearchError("Please enter a Teacher ID."); return; }

    setLoadingSearch(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/teachers/all`, { withCredentials: true });
      if (data.success) {
        const teacher = data.teachers.find(t => t.teacherId.toLowerCase() === searchId.toLowerCase());
        
        if (teacher) {
          setTargetTeacherId(teacher._id);
          setImagePreview(teacher.image ? `${backendUrl}${teacher.image}` : null);

          setFormData({
            teacherId: teacher.teacherId || '', name: teacher.name || '', mail: teacher.mail || '',
            designation: teacher.designation || '', phno: teacher.phno || '', password: ''
          });

          const qState = getQualState(teacher.payroll?.qualification);
          setPayroll({
            bankName: teacher.payroll?.bankName || '', accountNumber: teacher.payroll?.accountNumber || '',
            dateOfJoining: teacher.payroll?.dateOfJoining ? new Date(teacher.payroll.dateOfJoining).toISOString().split('T')[0] : '',
            dateOfPermanentAppt: teacher.payroll?.dateOfPermanentAppt ? new Date(teacher.payroll.dateOfPermanentAppt).toISOString().split('T')[0] : '',
            scaleCode: teacher.payroll?.scaleCode || '', sgbtSa: teacher.payroll?.sgbtSa || '', scale: teacher.payroll?.scale || '',
            basic: teacher.payroll?.basic || '', da: teacher.payroll?.da || '', hra: teacher.payroll?.hra || '', ca: teacher.payroll?.ca || '', gross: teacher.payroll?.gross || '',
            qualification: qState.qual,
            qualificationOther: qState.other
          });

          setTeacherFound(true);
        } else {
          setTargetTeacherId(null);
          setSearchError(`No faculty record found for ID "${searchId}".`);
        }
      }
    } catch (error) {
      setSearchError("Unable to connect to server.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetTeacherId) return;
    setUpdating(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'password' && !formData[key]) return; 
        submitData.append(key, formData[key]);
      });
      if (image) submitData.append('image', image);

      const finalPayroll = { ...payroll, qualification: payroll.qualification === 'Other' ? payroll.qualificationOther : payroll.qualification };
      submitData.append('payroll', JSON.stringify(finalPayroll));

      const { data } = await axios.put(`${backendUrl}/api/admin/teacher/update/${targetTeacherId}`, submitData, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success('Teacher updated successfully!');
        navigate('/admin/teachers');
      } else toast.error(data.message || 'Failed to update teacher');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm font-medium";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider";
  const sectionHeader = "text-lg font-serif font-bold text-navy border-l-4 border-emerald-500 pl-3 mb-4 mt-6";

  return (
    <div className="p-6 w-full max-w-6xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between mb-8">
        <h1 className="text-3xl font-bold text-navy flex items-center gap-3"><FiEdit className="text-emerald-600" /> Update Teacher</h1>
        <button onClick={() => navigate('/admin/teachers')} className="px-4 py-2 bg-white border rounded-xl text-slate-600 shadow-sm"><FiArrowLeft /> Back</button>
      </div>

      <div className="bg-white border rounded-3xl p-6 shadow-xl mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Teacher ID" className={`flex-1 ${inputClass}`} />
          <button type="submit" disabled={loadingSearch} className="px-8 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold">
            {loadingSearch ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchError && <div className="mt-4 text-rose-600 text-sm flex items-center gap-2"><FiAlertCircle /> {searchError}</div>}
      </div>

      {teacherFound && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-6 md:p-8 shadow-xl space-y-8">
          
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
              {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <FiUploadCloud className="text-3xl text-slate-400" />}
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div>
              <h3 className="font-bold text-navy">Update Photograph</h3>
              <p className="text-sm text-slate-500">Click image to replace.</p>
            </div>
          </div>

          <h3 className={sectionHeader}>Identity & Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className={labelClass}>Teacher ID</label><input type="text" name="teacherId" readOnly value={formData.teacherId} className={`${inputClass} bg-slate-100`} /></div>
            <div><label className={labelClass}>Name *</label><input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Designation *</label><input type="text" name="designation" required value={formData.designation} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Email *</label><input type="email" name="mail" required value={formData.mail} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Phone *</label><input type="text" name="phno" required value={formData.phno} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>New Password (Optional)</label><input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} /></div>
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

          <div className="flex justify-end gap-4 border-t pt-6">
            <button type="button" onClick={() => setTeacherFound(false)} className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={updating} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2">
              {updating ? 'Saving...' : <><FiSave /> Update Record</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UpdateTeacher;