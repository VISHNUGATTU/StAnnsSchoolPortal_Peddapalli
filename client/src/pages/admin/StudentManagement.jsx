import React from 'react';
import { Link } from 'react-router-dom';
import { FiUserPlus, FiEdit, FiUserX, FiSearch, FiArrowRight } from 'react-icons/fi';

const StudentManagement = () => {
  const managementOptions = [
    {
      title: 'Add New Student',
      description: 'Enroll a new student into the school system and assign them to a class.',
      icon: <FiUserPlus size={28} />,
      path: '/admin/add-student',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      groupHover: 'group-hover:bg-emerald-600 group-hover:text-white'
    },
    {
      title: 'Update Student',
      description: 'Modify existing student records, update personal details, or change grades.',
      icon: <FiEdit size={28} />,
      path: '/admin/update-student',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      groupHover: 'group-hover:bg-indigo-600 group-hover:text-white'
    },
    {
      title: 'Delete Student',
      description: 'Permanently remove a student record from the school database.',
      icon: <FiUserX size={28} />,
      path: '/admin/delete-student',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      groupHover: 'group-hover:bg-rose-600 group-hover:text-white'
    },
    {
      title: 'Search Students',
      description: 'Find students by roll number, name, or class to view their full profile.',
      icon: <FiSearch size={28} />,
      path: '/admin/search-student',
      color: 'text-gold-dark',
      bgColor: 'bg-gold/10',
      groupHover: 'group-hover:bg-gold group-hover:text-white'
    }
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-bold text-navy tracking-tight">
          Student <span className="text-gold-dark">Management</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Select an operation to manage the student directory and academic records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {managementOptions.map((option, index) => (
          <Link
            key={index}
            to={option.path}
            className="group relative bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-navy/5 hover:border-navy/10 overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full pointer-events-none"></div>
            
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${option.bgColor} ${option.color} ${option.groupHover} shadow-sm`}>
              {option.icon}
            </div>
            
            <h2 className="text-xl font-bold text-navy mb-3 group-hover:text-navy-light transition-colors">
              {option.title}
            </h2>
            
            <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
              {option.description}
            </p>

            <div className="mt-6 flex items-center text-sm font-bold text-navy/40 group-hover:text-gold-dark transition-colors duration-300">
              <span>Access Module</span>
              <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" size={16} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StudentManagement;