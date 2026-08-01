import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUserPlus, FiSave, FiArrowLeft, FiUploadCloud } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const AddStudent = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null);

  const [formData, setFormData] = useState({
    adno: '', studentIdNumber: '', name: '', password: '', gender: 'Male', dob: '', age: '',
    bloodGroup: '', aadhaarNumber: '', nationality: 'Indian', religion: '', caste: '', motherTongue: '',
    grade: '1', section: 'A', rollno: '', dateOfAdmission: '', previousSchool: '', tcNumber: '',
    mediumOfInstruction: 'English', firstLanguage: '', secondLanguage: '', houseClub: '', mail: ''
  });

  const [father, setFather] = useState({ name: '', aadhaarNumber: '', mobile: '', occupation: '', occupationOther: '', annualIncome: '', email: '' });
  const [mother, setMother] = useState({ name: '', aadhaarNumber: '', mobile: '', occupation: '', occupationOther: '', annualIncome: '', email: '' });
  const [guardian, setGuardian] = useState({ name: '', relationship: '', aadhaarNumber: '', mobile: '', occupation: '', address: '' });
  
  const [address, setAddress] = useState({ houseNumber: '', street: '', villageCity: '', mandal: '', district: '', state: '', pinCode: '' });
  const [transport, setTransport] = useState({ required: false, busRouteNumber: '', driverContact: '' });

  const [docs, setDocs] = useState({
    birthCertificate: false, studentAadhaarCopy: false, fatherAadhaarCopy: false, motherAadhaarCopy: false,
    photos: false, transferCertificate: false, studyCertificate: false, casteCertificate: false, incomeCertificate: false
  });

  const filterInput = (name, value) => {
    if (['mobile', 'driverContact'].includes(name)) return value.replace(/\D/g, '').slice(0, 10);
    if (name === 'aadhaarNumber') return value.replace(/\D/g, '').slice(0, 12);
    if (name === 'pinCode') return value.replace(/\D/g, '').slice(0, 6);
    // Removed busRouteNumber from strict digit filtering
    if (['adno', 'studentIdNumber', 'rollno', 'tcNumber', 'age', 'annualIncome'].includes(name)) return value.replace(/\D/g, '');
    if (['name', 'nationality', 'religion', 'caste', 'motherTongue', 'previousSchool', 'mediumOfInstruction', 'firstLanguage', 'secondLanguage', 'houseClub', 'relationship', 'mandal', 'district', 'state', 'villageCity'].includes(name)) return value.replace(/[^a-zA-Z\s]/g, '');
    return value;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: filterInput(e.target.name, e.target.value) });
  const handleFather = (e) => setFather({ ...father, [e.target.name]: filterInput(e.target.name, e.target.value) });
  const handleMother = (e) => setMother({ ...mother, [e.target.name]: filterInput(e.target.name, e.target.value) });
  const handleGuardian = (e) => setGuardian({ ...guardian, [e.target.name]: filterInput(e.target.name, e.target.value) });
  const handleAddress = (e) => setAddress({ ...address, [e.target.name]: filterInput(e.target.name, e.target.value) });
  const handleTransport = (e) => setTransport({ ...transport, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : filterInput(e.target.name, e.target.value) });
  const handleDocs = (e) => setDocs({ ...docs, [e.target.name]: e.target.checked });

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

      submitData.append('father', JSON.stringify({ ...father, occupation: father.occupation === 'Other' ? father.occupationOther : father.occupation }));
      submitData.append('mother', JSON.stringify({ ...mother, occupation: mother.occupation === 'Other' ? mother.occupationOther : mother.occupation }));
      submitData.append('guardian', JSON.stringify(guardian));
      submitData.append('address', JSON.stringify(address));
      submitData.append('transport', JSON.stringify(transport));
      submitData.append('documentsSubmitted', JSON.stringify(docs));

      const { data } = await axios.post(`${backendUrl}/api/student/add`, submitData, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Student enrolled successfully!');
        navigate('/admin/students');
      } else toast.error(data.message || 'Failed to add student');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-navy text-sm font-medium";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider";
  const sectionHeader = "text-lg font-serif font-bold text-navy border-l-4 border-gold pl-3 mb-4";

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3">
            <FiUserPlus className="text-gold-dark" /> Student Enrollment Form
          </h1>
        </div>
        <button onClick={() => navigate('/admin/students')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm">
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-10">
        
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
            {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <FiUploadCloud className="text-3xl text-slate-400" />}
            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div>
            <h3 className="font-bold text-navy">Student Photograph</h3>
            <p className="text-sm text-slate-500">Optional. Max size 2MB.</p>
          </div>
        </div>

        <div>
          <h3 className={sectionHeader}>Academic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className={labelClass}>Admission No. *</label><input type="text" name="adno" required value={formData.adno} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Grade *</label>
              <select name="grade" value={formData.grade} onChange={handleChange} className={inputClass}>
                {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => <option key={g} value={g}>Class {g}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Section *</label>
              <select name="section" value={formData.section} onChange={handleChange} className={inputClass}>
                {["A", "B", "C", "D"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Roll Number *</label><input type="text" name="rollno" required value={formData.rollno} onChange={handleChange} className={inputClass} /></div>
            
            <div><label className={labelClass}>Date of Admission</label><input type="date" name="dateOfAdmission" value={formData.dateOfAdmission} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Previous School</label><input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>TC Number</label><input type="text" name="tcNumber" value={formData.tcNumber} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Medium of Instruction</label><input type="text" name="mediumOfInstruction" value={formData.mediumOfInstruction} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>First Language</label><input type="text" name="firstLanguage" value={formData.firstLanguage} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Second Language</label><input type="text" name="secondLanguage" value={formData.secondLanguage} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>House / Club</label><input type="text" name="houseClub" value={formData.houseClub} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Student ID Number</label><input type="text" name="studentIdNumber" value={formData.studentIdNumber} onChange={handleChange} className={inputClass} /></div>
          </div>
        </div>

        <div>
          <h3 className={sectionHeader}>Personal & Login Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2"><label className={labelClass}>Full Name *</label><input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Date of Birth *</label><input type="date" name="dob" required value={formData.dob} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Gender *</label>
              <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
              </select>
            </div>
            
            <div><label className={labelClass}>Email Address</label><input type="email" name="mail" value={formData.mail} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Portal Password *</label><input type="password" name="password" required value={formData.password} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Blood Group *</label>
              <select name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange} className={inputClass}>
                <option value="">Select</option>{["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Age</label><input type="text" name="age" value={formData.age} onChange={handleChange} className={inputClass} /></div>
            
            <div><label className={labelClass}>Aadhaar Number</label><input type="text" name="aadhaarNumber" maxLength={12} value={formData.aadhaarNumber} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Nationality</label><input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Religion</label><input type="text" name="religion" value={formData.religion} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Caste / Category</label><input type="text" name="caste" value={formData.caste} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Mother Tongue</label><input type="text" name="motherTongue" value={formData.motherTongue} onChange={handleChange} className={inputClass} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className={sectionHeader}>Father's Details</h3>
            <div className="space-y-4">
              <div><label className={labelClass}>Name *</label><input type="text" name="name" required value={father.name} onChange={handleFather} className={inputClass} /></div>
              <div><label className={labelClass}>Mobile Number *</label><input type="text" name="mobile" required maxLength={10} value={father.mobile} onChange={handleFather} className={inputClass} /></div>
              <div><label className={labelClass}>Occupation *</label>
                <select name="occupation" required value={father.occupation} onChange={handleFather} className={inputClass}>
                  <option value="">Select</option><option value="Business">Business</option><option value="Govt Employee">Govt Employee</option><option value="Private Sector">Private Sector</option><option value="Farmer">Farmer</option><option value="Other">Other</option>
                </select>
                {father.occupation === 'Other' && <input type="text" name="occupationOther" placeholder="Specify Occupation" required value={father.occupationOther} onChange={handleFather} className={`mt-2 ${inputClass} border-gold`} />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Aadhaar No.</label><input type="text" name="aadhaarNumber" maxLength={12} value={father.aadhaarNumber} onChange={handleFather} className={inputClass} /></div>
                <div><label className={labelClass}>Annual Income</label><input type="text" name="annualIncome" value={father.annualIncome} onChange={handleFather} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Email</label><input type="email" name="email" value={father.email} onChange={handleFather} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <h3 className={sectionHeader}>Mother's Details</h3>
            <div className="space-y-4">
              <div><label className={labelClass}>Name *</label><input type="text" name="name" required value={mother.name} onChange={handleMother} className={inputClass} /></div>
              <div><label className={labelClass}>Mobile Number *</label><input type="text" name="mobile" required maxLength={10} value={mother.mobile} onChange={handleMother} className={inputClass} /></div>
              <div><label className={labelClass}>Occupation *</label>
                <select name="occupation" required value={mother.occupation} onChange={handleMother} className={inputClass}>
                  <option value="">Select</option><option value="Homemaker">Homemaker</option><option value="Govt Employee">Govt Employee</option><option value="Private Sector">Private Sector</option><option value="Business">Business</option><option value="Other">Other</option>
                </select>
                {mother.occupation === 'Other' && <input type="text" name="occupationOther" placeholder="Specify Occupation" required value={mother.occupationOther} onChange={handleMother} className={`mt-2 ${inputClass} border-gold`} />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Aadhaar No.</label><input type="text" name="aadhaarNumber" maxLength={12} value={mother.aadhaarNumber} onChange={handleMother} className={inputClass} /></div>
                <div><label className={labelClass}>Annual Income</label><input type="text" name="annualIncome" value={mother.annualIncome} onChange={handleMother} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Email</label><input type="email" name="email" value={mother.email} onChange={handleMother} className={inputClass} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className={sectionHeader}>Address Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={labelClass}>House No. / Street</label><input type="text" name="houseNumber" value={address.houseNumber} onChange={handleAddress} className={inputClass} /></div>
              <div className="col-span-2"><label className={labelClass}>Village / Locality</label><input type="text" name="villageCity" value={address.villageCity} onChange={handleAddress} className={inputClass} /></div>
              <div><label className={labelClass}>Mandal</label><input type="text" name="mandal" value={address.mandal} onChange={handleAddress} className={inputClass} /></div>
              <div><label className={labelClass}>District</label><input type="text" name="district" value={address.district} onChange={handleAddress} className={inputClass} /></div>
              <div><label className={labelClass}>State</label><input type="text" name="state" value={address.state} onChange={handleAddress} className={inputClass} /></div>
              <div><label className={labelClass}>PIN Code</label><input type="text" name="pinCode" maxLength={6} value={address.pinCode} onChange={handleAddress} className={inputClass} /></div>
            </div>
          </div>
          <div>
            <h3 className={sectionHeader}>Guardian Details (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={labelClass}>Name</label><input type="text" name="name" value={guardian.name} onChange={handleGuardian} className={inputClass} /></div>
              <div><label className={labelClass}>Relationship</label><input type="text" name="relationship" value={guardian.relationship} onChange={handleGuardian} className={inputClass} /></div>
              <div><label className={labelClass}>Mobile</label><input type="text" name="mobile" maxLength={10} value={guardian.mobile} onChange={handleGuardian} className={inputClass} /></div>
              <div><label className={labelClass}>Occupation</label><input type="text" name="occupation" value={guardian.occupation} onChange={handleGuardian} className={inputClass} /></div>
              <div><label className={labelClass}>Aadhaar No.</label><input type="text" name="aadhaarNumber" maxLength={12} value={guardian.aadhaarNumber} onChange={handleGuardian} className={inputClass} /></div>
              <div className="col-span-2"><label className={labelClass}>Address</label><input type="text" name="address" value={guardian.address} onChange={handleGuardian} className={inputClass} /></div>
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionHeader}>Transport & Documents Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-navy">
                <input type="checkbox" name="required" checked={transport.required} onChange={handleTransport} className="w-4 h-4 accent-navy" />
                School Transport Required?
              </label>
              {transport.required && (
                <div className="space-y-3 pt-2">
                  <div><label className={labelClass}>Bus Route Number</label><input type="text" name="busRouteNumber" value={transport.busRouteNumber} onChange={handleTransport} className={inputClass} /></div>
                  <div><label className={labelClass}>Driver / Attendant Contact</label><input type="text" name="driverContact" maxLength={10} value={transport.driverContact} onChange={handleTransport} className={inputClass} /></div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {Object.keys(docs).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" name={key} checked={docs[key]} onChange={handleDocs} className="w-4 h-4 accent-navy" />
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/students')} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
          <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl font-bold text-white bg-navy hover:bg-navy-light flex items-center gap-2">
            {loading ? 'Saving...' : <><FiSave /> Save Complete Record</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;