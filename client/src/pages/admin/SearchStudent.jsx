import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import { 
  FiSearch, FiArrowLeft, FiUser, FiAlertCircle, 
  FiMail, FiPhone, FiMapPin, FiCalendar, FiDroplet, FiBriefcase, FiFileText, FiTruck, FiCheckCircle, FiXCircle, FiDownload
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';

const SearchStudent = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  
  const [searchParams, setSearchParams] = useState({ grade: '1', section: 'A', rollno: '' });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [student, setStudent] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    if (searchError) setSearchError('');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(''); setStudent(null);

    if (!searchParams.rollno.trim()) {
      setSearchError("Please enter a Roll Number to search."); return;
    }

    setLoadingSearch(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/students/all`, { withCredentials: true });

      if (data.success) {
        const found = data.students.find(s => s.grade === searchParams.grade && s.section === searchParams.section && s.rollno.toLowerCase() === searchParams.rollno.toLowerCase());
        if (found) setStudent(found);
        else setSearchError(`No student record found for Roll Number "${searchParams.rollno}".`);
      }
    } catch (error) {
      setSearchError("Unable to connect to the server to fetch student details.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  const downloadProfilePDF = () => {
    if (!student) return;
    const doc = new jsPDF();

    // 1. Official School Header (Red Header Block from Image)
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

    // 2. Report Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("STUDENT PROFILE REPORT", 105, 56, { align: "center" });

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

    addSection("Academic Information", [
      { label: "Full Name", value: student.name },
      { label: "Admission No.", value: student.adno },
      { label: "Class & Section", value: `${student.grade} - ${student.section}` },
      { label: "Roll Number", value: student.rollno },
      { label: "Student ID No.", value: student.studentIdNumber },
      { label: "Date of Admission", value: formatDate(student.dateOfAdmission) },
      { label: "Previous School", value: student.previousSchool },
      { label: "TC Number", value: student.tcNumber },
      { label: "Medium of Instruction", value: student.mediumOfInstruction },
      { label: "First Language", value: student.firstLanguage },
      { label: "Second Language", value: student.secondLanguage },
      { label: "House / Club", value: student.houseClub }
    ]);

    addSection("Personal Details", [
      { label: "Date of Birth", value: formatDate(student.dob) },
      { label: "Age", value: student.age },
      { label: "Gender", value: student.gender },
      { label: "Blood Group", value: student.bloodGroup },
      { label: "Email Address", value: student.mail },
      { label: "Aadhaar Number", value: student.aadhaarNumber },
      { label: "Nationality", value: student.nationality },
      { label: "Religion", value: student.religion },
      { label: "Caste/Category", value: student.caste },
      { label: "Mother Tongue", value: student.motherTongue }
    ]);

    addSection("Father's Details", [
      { label: "Name", value: student.father?.name },
      { label: "Mobile", value: student.father?.mobile },
      { label: "Occupation", value: student.father?.occupation },
      { label: "Aadhaar Number", value: student.father?.aadhaarNumber },
      { label: "Annual Income", value: student.father?.annualIncome },
      { label: "Email", value: student.father?.email }
    ]);

    addSection("Mother's Details", [
      { label: "Name", value: student.mother?.name },
      { label: "Mobile", value: student.mother?.mobile },
      { label: "Occupation", value: student.mother?.occupation },
      { label: "Aadhaar Number", value: student.mother?.aadhaarNumber },
      { label: "Annual Income", value: student.mother?.annualIncome },
      { label: "Email", value: student.mother?.email }
    ]);

    if (student.guardian?.name) {
      addSection("Guardian Details", [
        { label: "Name", value: student.guardian.name },
        { label: "Relationship", value: student.guardian.relationship },
        { label: "Mobile", value: student.guardian.mobile },
        { label: "Occupation", value: student.guardian.occupation },
        { label: "Aadhaar Number", value: student.guardian.aadhaarNumber },
        { label: "Address", value: student.guardian.address }
      ]);
    }

    addSection("Address Information", [
      { label: "House No. / Street", value: student.address?.houseNumber },
      { label: "Village / Locality", value: student.address?.villageCity },
      { label: "Mandal", value: student.address?.mandal },
      { label: "District", value: student.address?.district },
      { label: "State", value: student.address?.state },
      { label: "PIN Code", value: student.address?.pinCode }
    ]);

    addSection("Transport Config", [
      { label: "School Transport Reqd.", value: student.transport?.required ? 'Yes' : 'No' },
      { label: "Bus Route Number", value: student.transport?.busRouteNumber },
      { label: "Driver Contact", value: student.transport?.driverContact }
    ]);

    const activeDocs = Object.keys(student.documentsSubmitted || {}).filter(k => student.documentsSubmitted[k]).map(k => k.replace(/([A-Z])/g, ' $1').trim());
    addSection("Submitted Documents", [
      { label: "Checklist", value: activeDocs.length > 0 ? activeDocs.join(", ") : "None" }
    ]);

    // Footer Block
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

    doc.save(`Profile_${student.adno}_${student.name.replace(/\s+/g, '_')}.pdf`);
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
          <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-3">
            <FiSearch className="text-gold-dark" /> Student Directory
          </h1>
        </div>
        <button onClick={() => navigate('/admin/students')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm"><FiArrowLeft /> Back</button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Grade</label>
              <select name="grade" value={searchParams.grade} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-navy">
                {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(g => <option key={g} value={g}>Class {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Section</label>
              <select name="section" value={searchParams.section} onChange={handleSearchChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-navy">
                {["A", "B", "C", "D"].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Roll Number</label>
              <input type="text" name="rollno" value={searchParams.rollno} onChange={handleSearchChange} placeholder="Enter Roll No" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-navy" />
            </div>
          </div>
          <button type="submit" disabled={loadingSearch} className="px-8 py-3.5 rounded-xl font-bold text-white bg-navy hover:bg-navy-light flex items-center justify-center gap-2 h-full">
            {loadingSearch ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiSearch /> Search</>}
          </button>
        </form>
        {searchError && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3"><FiAlertCircle className="text-rose-500 mt-0.5" /><p className="text-rose-700 font-medium text-sm">{searchError}</p></div>
        )}
      </div>

      {student && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
          <div className="h-32 bg-gradient-to-r from-navy to-navy-light relative">
            <div className="absolute top-4 right-6">
              <button onClick={downloadProfilePDF} className="bg-white text-navy font-bold px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                <FiDownload /> Download Profile
              </button>
            </div>
            <div className="absolute -bottom-12 left-8 flex items-end gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {student.image ? <img src={`${backendUrl}${student.image}`} alt="Profile" className="w-full h-full object-cover" /> : <FiUser size={40} className="text-slate-400" />}
              </div>
              <div className="pb-2">
                <h2 className="text-3xl font-bold text-white">{student.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">ADNO: {student.adno}</span>
                  <span className="px-3 py-1 bg-gold text-navy-dark text-xs font-bold rounded-full">Class {student.grade}-{student.section} | Roll: {student.rollno}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-navy border-b border-slate-200 pb-2 mb-3">Academic Info</h3>
              <InfoRow label="Admission No" value={student.adno} />
              <InfoRow label="Student ID" value={student.studentIdNumber} />
              <InfoRow label="DOA" value={formatDate(student.dateOfAdmission)} />
              <InfoRow label="Previous School" value={student.previousSchool} />
              <InfoRow label="TC Number" value={student.tcNumber} />
              <InfoRow label="Medium" value={student.mediumOfInstruction} />
              <InfoRow label="1st Lang" value={student.firstLanguage} />
              <InfoRow label="2nd Lang" value={student.secondLanguage} />
              <InfoRow label="House/Club" value={student.houseClub} />
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-navy border-b border-slate-200 pb-2 mb-3">Personal Details</h3>
              <InfoRow label="DOB" value={formatDate(student.dob)} />
              <InfoRow label="Age" value={student.age} />
              <InfoRow label="Gender" value={student.gender} />
              <InfoRow label="Blood Group" value={student.bloodGroup} />
              <InfoRow label="Email" value={student.mail} />
              <InfoRow label="Aadhaar" value={student.aadhaarNumber} />
              <InfoRow label="Nationality" value={student.nationality} />
              <InfoRow label="Religion/Caste" value={`${student.religion || 'N/A'} / ${student.caste || 'N/A'}`} />
              <InfoRow label="Mother Tongue" value={student.motherTongue} />
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-navy border-b border-slate-200 pb-2 mb-3">Father's Info</h3>
              <InfoRow label="Name" value={student.father?.name} />
              <InfoRow label="Mobile" value={student.father?.mobile} />
              <InfoRow label="Occupation" value={student.father?.occupation} />
              <InfoRow label="Aadhaar" value={student.father?.aadhaarNumber} />
              <InfoRow label="Annual Income" value={student.father?.annualIncome} />
              <InfoRow label="Email" value={student.father?.email} />
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-navy border-b border-slate-200 pb-2 mb-3">Mother's Info</h3>
              <InfoRow label="Name" value={student.mother?.name} />
              <InfoRow label="Mobile" value={student.mother?.mobile} />
              <InfoRow label="Occupation" value={student.mother?.occupation} />
              <InfoRow label="Aadhaar" value={student.mother?.aadhaarNumber} />
              <InfoRow label="Annual Income" value={student.mother?.annualIncome} />
              <InfoRow label="Email" value={student.mother?.email} />
            </div>

            {student.guardian?.name && (
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-navy border-b border-slate-200 pb-2 mb-3">Guardian Info</h3>
                <InfoRow label="Name" value={student.guardian.name} />
                <InfoRow label="Relationship" value={student.guardian.relationship} />
                <InfoRow label="Mobile" value={student.guardian.mobile} />
                <InfoRow label="Occupation" value={student.guardian.occupation} />
                <InfoRow label="Aadhaar" value={student.guardian.aadhaarNumber} />
              </div>
            )}

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-navy border-b border-slate-200 pb-2 mb-3">Address & Transport</h3>
              <p className="text-sm font-semibold text-slate-800 mb-4 pb-4 border-b border-slate-100">
                {student.address?.houseNumber && `${student.address.houseNumber}, `}
                {student.address?.villageCity && `${student.address.villageCity}, `}
                {student.address?.mandal && `${student.address.mandal}, `}
                {student.address?.district && `${student.address.district}, `}
                {student.address?.state && `${student.address.state} `}
                {student.address?.pinCode}
              </p>
              <InfoRow label="Transport Req." value={student.transport?.required ? 'Yes' : 'No'} />
              {student.transport?.required && (
                <>
                  <InfoRow label="Route No" value={student.transport?.busRouteNumber} />
                  <InfoRow label="Driver Phone" value={student.transport?.driverContact} />
                </>
              )}
            </div>

            <div className="lg:col-span-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm mt-2">
              <h3 className="text-lg font-bold text-navy border-b border-slate-200 pb-2 mb-4">Documents Checklist</h3>
              {student.documentsSubmitted ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(student.documentsSubmitted).map(docKey => (
                    <div key={docKey} className="flex items-center gap-2">
                      {student.documentsSubmitted[docKey] ? <FiCheckCircle className="text-emerald-500" /> : <FiXCircle className="text-rose-400" />}
                      <span className={`text-sm ${student.documentsSubmitted[docKey] ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        {docKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No document checklist found.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SearchStudent;