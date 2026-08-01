import React from 'react';

const Loader = ({ fullScreen = true }) => {
  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'h-full w-full min-h-[400px]'} bg-navy flex items-center justify-center relative overflow-hidden font-sans`}>
      
      {/* Subtle Background Glow to match theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-dark rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse-slow"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Premium Spinner */}
        <div className="w-16 h-16 border-4 border-white/10 border-t-gold border-r-gold/50 rounded-full animate-spin shadow-[0_0_15px_rgba(251,191,36,0.3)]"></div>
        
        {/* Brand/Loading Text */}
        <div className="mt-6 flex flex-col items-center">
           <span className="text-gold font-serif font-semibold text-lg tracking-widest animate-pulse">SAINTS HIGH</span>
           <span className="text-slate-400 text-xs tracking-widest mt-1 uppercase">Authenticating...</span>
        </div>
      </div>
      
    </div>
  );
};

export default Loader;