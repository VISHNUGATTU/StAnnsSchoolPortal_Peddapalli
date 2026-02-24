import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiUserPlus,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiBriefcase
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";

// Professional color palette for the chart
const CHART_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#0ea5e9", // Sky Blue
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#64748b", // Slate
];

const FacultyManagement = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/admin/count');
        setDashboardData(response.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const actionCards = [
    {
      title: "Add Faculty",
      desc: "Register a new faculty into the system",
      icon: <FiUserPlus className="w-5 h-5" />,
      path: "/admin/faculty-management/add",
      theme: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Update Faculty",
      desc: "Edit existing faculty details",
      icon: <FiEdit className="w-5 h-5" />,
      path: "/admin/faculty-management/update",
      theme: "bg-purple-50 text-purple-600",
    },
    {
      title: "Delete Faculty",
      desc: "Remove a faculty permanently",
      icon: <FiTrash2 className="w-5 h-5" />,
      path: "/admin/faculty-management/delete",
      theme: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in-up pb-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Faculty Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage personnel and monitor department distributions.</p>
      </div>

      {/* MAIN ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actionCards.map((c) => (
          <button
            key={c.title}
            onClick={() => navigate(c.path)}
            className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition text-left group"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-4 transition-transform group-hover:scale-110 ${c.theme}`}>
              {c.icon}
            </div>
            <h3 className="font-bold text-slate-800">{c.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
          </button>
        ))}
      </div>

      <hr className="border-slate-100" />

      {/* DYNAMIC DASHBOARD DATA */}
      {isLoading ? (
        <div className="animate-pulse flex gap-8">
          <div className="w-1/3 flex flex-col gap-6">
            <div className="h-32 bg-slate-200 rounded-3xl w-full"></div>
            <div className="h-32 bg-slate-200 rounded-3xl w-full"></div>
          </div>
          <div className="w-2/3 h-72 bg-slate-200 rounded-3xl"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDE: 2 Rows of Stats */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Row 1: Total Faculty */}
            <div className="flex-1 flex flex-col justify-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <FiUsers className="w-5 h-5"/>
                </div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Faculty</h2>
              </div>
              {/* Reduced font size from text-4xl to text-2xl */}
              <p className="text-2xl font-bold text-slate-800 ml-1">
                {dashboardData.totalFaculty}
              </p>
            </div>

            {/* Row 2: Department Count */}
            <div className="flex-1 flex flex-col justify-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <FiBriefcase className="w-5 h-5"/>
                </div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments</h2>
              </div>
              {/* Reduced font size from text-4xl to text-2xl */}
              <p className="text-2xl font-bold text-slate-800 ml-1">
                {dashboardData.departmentCount}
              </p>
            </div>

          </div>

          {/* RIGHT SIDE: Bar Graph with Custom Legend */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Faculty per Department</h2>
            
            {/* Chart Area */}
            <div className="flex-1 min-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.departmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="department" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={35}>
                    {dashboardData.departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Professional Legend */}
            <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-4 justify-center">
              {dashboardData.departmentData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  ></span>
                  <span className="text-xs font-medium text-slate-600">{entry.department}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;