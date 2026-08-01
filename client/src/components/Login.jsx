import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { 
  FiMail, FiLock, FiUser, FiChevronDown, 
  FiArrowRight, FiShield, FiBookOpen, FiAward, FiHash,
  FiEye, FiEyeOff
} from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

// 🚨 NEW: Import the St. Ann's logo and the school building background image
import schoolLogo from "../assets/St_logo.jpeg";
import schoolBg from "../assets/St_school.jpeg"; // Adjust path to where your background image is located

const Login = () => {
  const navigate = useNavigate();
  const { checkAuth, backendUrl } = useAppContext(); 

  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [detectedRole, setDetectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "loginId") {
      detectRole(value);
    }
  };

  const detectRole = (id) => {
    const trimmedId = id.trim();
    if (!trimmedId) {
      setDetectedRole(null);
      return;
    }
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      try {
            const { data } = await axios.post(
            `${backendUrl}/api/admin/check-id`,
            { loginId: trimmedId },
            {
              withCredentials: false,
            }
          );
        if (data.success && data.role) {
          setDetectedRole(data.role);
        } else {
          setDetectedRole(null);
        }
      } catch (err) {
        setDetectedRole(null);
      }
    }, 400); 
  };

  const validateForm = () => {
    if (!formData.loginId.trim()) {
      toast.error("Enter your Login ID");
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (!detectedRole) {
        toast.error("Could not determine account type. Please check your Login ID.");
        return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = { password: formData.password };
      if (detectedRole === "admin") payload.mail = formData.loginId.trim().toLowerCase();
      if (detectedRole === "teacher") payload.teacherId = formData.loginId.trim();
      if (detectedRole === "student") payload.adno = formData.loginId.trim();

      const { data } = await axios.post(
        `${backendUrl}/api/${detectedRole}/login`,
        payload,
        { withCredentials: true }
      );

      if (!data.success) {
        toast.error(data.message || "Login failed");
        return;
      }

      toast.success("Login successful");

      sessionStorage.setItem("role", detectedRole.toUpperCase());
      await checkAuth();

      if (detectedRole === "admin") navigate("/admin/dashboard");
      else if (detectedRole === "teacher") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Server error during authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">
      
      {/* ========================================= */}
      {/* LEFT PANEL : BRANDING & HERO (Hidden on Mobile) */}
      {/* ========================================= */}
      <div 
        className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${schoolBg})` }}
      >
        {/* Dark overlay so the white text is perfectly readable over the image */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40 z-0"></div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl overflow-hidden shrink-0 border border-slate-700/50">
            <img src={schoolLogo} alt="St. Ann's Crest" className="w-full h-full object-cover" />
          </div>
          <span className="text-[26px] font-serif font-bold text-white tracking-wide leading-tight">
            St. Ann's <span className="text-amber-400">High School</span>
          </span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg mb-20 animate-slide-up">
          <h1 className="text-5xl font-serif font-bold text-white leading-[1.15] mb-6">
            Empowering the <br /> Next Generation.
          </h1>
          <p className="text-slate-200 text-lg leading-relaxed mb-8 font-medium">
            Welcome to the official digital portal. Access your academic records, schedules, and seamless communication all in one secure platform.
          </p>

          {/* Feature Badges */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg">
              <FiBookOpen className="text-amber-400" /> Advanced Curriculum
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg">
              <FiAward className="text-amber-400" /> Excellence Awarded
            </div>
          </div>
        </div>

        {/* 🚨 UPDATED: Footer info converted to a clickable link with hover effect */}
        <div className="relative z-10 text-sm font-medium">
          <a 
            href="https://github.com/GayathriKarthikeya9871/VisOra_retina/blob/main/Published10-04-2026.jpeg" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-amber-400 transition-colors"
          >
            © {new Date().getFullYear()} St. Ann's High School. All rights reserved to VisORA.
          </a>
        </div>
      </div>

      {/* ========================================= */}
      {/* RIGHT PANEL : LOGIN FORM */}
      {/* ========================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 relative">
        
        {/* Mobile Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-navy/5 rounded-full blur-[80px] lg:hidden pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-amber-400/10 rounded-full blur-[80px] lg:hidden pointer-events-none"></div>

        <div className="w-full max-w-md p-8 sm:p-12 relative z-10 animate-fade-in">
          
          {/* Mobile Logo */}
          <div className="flex lg:hidden flex-col items-center justify-center gap-3 mb-10 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 overflow-hidden border border-slate-200">
              <img src={schoolLogo} alt="St. Ann's Crest" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-serif font-bold text-slate-800 tracking-tight leading-tight">
              St. Ann's <br/><span className="text-amber-500 text-xl">High School</span>
            </span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-medium text-sm">Please sign in to your secure account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Auto-Detected Role Display */}
            {detectedRole && (
              <div className="flex items-center justify-center lg:justify-start gap-2 text-sm font-bold animate-fade-in">
                <span className="text-slate-400">Detected Portal:</span>
                <span
                  className={`px-3 py-1 rounded-full ${
                    detectedRole === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : detectedRole === "teacher"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {detectedRole.charAt(0).toUpperCase() + detectedRole.slice(1)} Portal
                </span>
              </div>
            )}

            {/* Unified Login ID Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Login ID
              </label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <FiUser size={20} />
                </div>
                <input
                  type="text"
                  name="loginId"
                  placeholder="Email, Teacher ID, or Admission No."
                  value={formData.loginId}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full bg-white text-slate-800 pl-12 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all placeholder:text-slate-400 font-medium hover:border-slate-300 shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Security Key
              </label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <FiLock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white text-slate-800 pl-12 pr-12 py-4 rounded-2xl border border-slate-200 outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all placeholder:text-slate-400 font-medium hover:border-slate-300 shadow-sm"
                />
                <div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/25 transform transition-all duration-200 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 mt-8"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Secure Sign In</span>
                  <FiArrowRight className="text-amber-400" size={18} />
                </>
              )}
            </button>

          </form>

          {/* 🚨 UPDATED: Mobile Footer info converted to a clickable link with hover effect */}
          <p className="lg:hidden text-center text-slate-400 text-xs mt-12 font-medium">
            <a 
              href="https://github.com/GayathriKarthikeya9871/VisOra_retina/blob/main/Published10-04-2026.jpeg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-amber-500 transition-colors"
            >
              © {new Date().getFullYear()} St. Ann's High School. All rights reserved to VisORA.
            </a>
          </p>
          
        </div>
      </div>
    </div>
  );
};

export default Login;