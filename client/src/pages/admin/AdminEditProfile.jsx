import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiSave,
  FiArrowLeft,
  FiCamera,
  FiEdit2,
  FiX,
  FiInfo
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const EditProfile = () => {
  const { axios, setAdminInfo } = useAppContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ================= DATA =================
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");
  const [file, setFile] = useState(null);

  // ================= EDIT STATES =================
  const [editName, setEditName] = useState(false);
  const [editMail, setEditMail] = useState(false);
  const [editPhone, setEditPhone] = useState(false);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/api/admin/is-auth");
        if (data.success) {
          const admin = data.admin;
          setName(admin.name || "");
          setMail(admin.mail || "");
          setPhone(admin.phone || "");
          setImage(admin.image || "");
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [axios]);

  /* ================= IMAGE ================= */
  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setImage(URL.createObjectURL(selected));
    }
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("mail", mail);
      formData.append("phone", phone);
      if (file) formData.append("image", file);

      const { data } = await axios.put("/api/admin/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        toast.success("Profile updated successfully");
        setAdminInfo(data.admin);
        navigate("/admin/profile");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const getAvatar = () =>
    image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=e2e8f0&color=475569&size=128`;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-500 tracking-wide">Fetching credentials...</p>
      </div>
    );
  }

  const canSave = editName || editMail || editPhone || file;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900 animate-fade-in-up">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm group"
            title="Go back"
          >
            <FiArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Edit Profile</h1>
            <p className="text-sm text-slate-500 mt-1">Update your administrative identity and contact details.</p>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 sm:p-10 space-y-12">
            
            {/* AVATAR UPLOAD */}
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-8 border-b border-slate-100 pb-10">
              <div className="relative group shrink-0">
                {/* Decorative Ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-100 to-indigo-50 rounded-full blur-sm opacity-70"></div>
                
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-50">
                  <img src={getAvatar()} alt="avatar" className="w-full h-full object-cover"/>
                </div>
                
                {/* Hover Overlay */}
                <label
                  htmlFor="upload"
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200 backdrop-blur-sm m-1"
                >
                  <FiCamera size={24} className="mb-1" />
                  <span className="text-xs font-semibold tracking-wider uppercase">Change</span>
                </label>
                
                <input
                  type="file"
                  id="upload"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold text-slate-800">Profile Picture</h3>
                <p className="text-sm text-slate-500 mt-1.5 mb-5 max-w-sm leading-relaxed">
                  We support high-resolution PNGs, JPEGs, and GIFs under 5MB. 
                </p>
                <label 
                  htmlFor="upload" 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm"
                >
                  <FiCamera size={16} className="text-slate-400" />
                  Upload new image
                </label>
              </div>
            </div>

            {/* FORM FIELDS */}
            <div className="space-y-8 max-w-2xl">
              <Field
                label="Full Name"
                icon={<FiUser />}
                value={name}
                editable={editName}
                onEdit={() => setEditName(true)}
                onCancel={() => { setEditName(false); setName(name); }}
                onChange={setName}
              />

              <Field
                label="Email Address"
                icon={<FiMail />}
                value={mail}
                editable={editMail}
                onEdit={() => setEditMail(true)}
                onCancel={() => setEditMail(false)}
                onChange={setMail}
                type="email"
                note="Changing your email address will immediately update your administrative login credentials."
              />

              <Field
                label="Phone Number"
                icon={<FiPhone />}
                value={phone}
                editable={editPhone}
                onEdit={() => setEditPhone(true)}
                onCancel={() => setEditPhone(false)}
                onChange={setPhone}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* SAVE FOOTER */}
          <div className="bg-slate-50/80 px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-transparent hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!canSave || saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 active:scale-95"
            >
              <FiSave size={16} />
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= REUSABLE FIELD (PROFESSIONAL REDESIGN) ================= */
const Field = ({
  label,
  icon,
  value,
  editable,
  onEdit,
  onCancel,
  onChange,
  type = "text",
  placeholder,
  note,
}) => (
  <div className="flex flex-col gap-2">
    {/* Label & Action Toggle Area */}
    <div className="flex items-center justify-between">
      <label className="text-sm font-bold text-slate-700">
        {label}
      </label>
      {!editable ? (
        <button 
          type="button"
          onClick={onEdit} 
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-indigo-50"
        >
          <FiEdit2 size={12}/> Edit
        </button>
      ) : (
        <button 
          type="button"
          onClick={onCancel} 
          className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-red-50"
        >
          <FiX size={14}/> Cancel
        </button>
      )}
    </div>

    {/* Input Area */}
    <div className="relative flex items-center">
      {/* Fixed Icon Prefix */}
      <div className={`absolute left-4 flex items-center pointer-events-none transition-colors ${editable ? 'text-indigo-500' : 'text-slate-400'}`}>
        {icon}
      </div>

      <input
        type={type}
        value={value}
        disabled={!editable}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full py-3 pl-11 pr-4 text-sm rounded-xl outline-none transition-all ${
          editable 
            ? "bg-white border-2 border-indigo-500 text-slate-900 shadow-sm shadow-indigo-100/50" 
            : "bg-slate-50 border-2 border-slate-100 text-slate-500 cursor-not-allowed"
        }`}
      />
    </div>

    {/* Explanatory Note */}
    {note && (
      <p className="mt-1.5 text-xs text-slate-500 flex items-start gap-1.5">
        <FiInfo className="text-indigo-400 shrink-0 mt-0.5" />
        {note}
      </p>
    )}
  </div>
);

export default EditProfile;