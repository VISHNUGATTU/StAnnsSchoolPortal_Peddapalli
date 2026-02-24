import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle
} from "react-icons/fi";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

const COLORS = {
  primary: "#6366f1",   // Indigo
  secondary: "#10b981", // Emerald
  accent: "#f43f5e",    // Rose
  warning: "#f59e0b",   // Amber
  purple: "#8b5cf6",    // Purple
  sky: "#0ea5e9",       // Sky Blue
  slate: "#64748b"
};

const POPULATION_COLORS = [COLORS.primary, COLORS.secondary];
const YEAR_COLORS = [COLORS.secondary, COLORS.sky, COLORS.primary, COLORS.purple]; 

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/admin/analytics/comprehensive');
        setData(response.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-6">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-3xl w-full"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-3xl w-full"></div>
          <div className="h-80 bg-slate-200 rounded-3xl w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-3xl">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">System Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time overview of institutional data derived directly from the database.</p>
      </div>

      {/* ROW 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><FiUsers className="w-6 h-6"/></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Population</p>
            <p className="text-2xl font-bold text-slate-800">{data.kpis.totalUsers}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><FiTrendingUp className="w-6 h-6"/></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg Attendance</p>
            <p className="text-2xl font-bold text-slate-800">{data.kpis.avgAttendance}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><FiActivity className="w-6 h-6"/></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Schedules</p>
            <p className="text-2xl font-bold text-slate-800">{data.kpis.activeCourses}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4 bg-rose-50/30">
          <div className="p-3 rounded-xl bg-rose-100 text-rose-600"><FiAlertCircle className="w-6 h-6"/></div>
          <div>
            <p className="text-sm font-medium text-rose-600">At-Risk (&lt;75%)</p>
            <p className="text-2xl font-bold text-rose-700">{data.kpis.criticalAlerts}</p>
          </div>
        </div>
      </div>

      {/* ROW 2: Distribution Charts (Pie Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Population Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-bold text-slate-800 mb-2 w-full text-left">System Users</h2>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={data.population}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.population.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={POPULATION_COLORS[index % POPULATION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full flex justify-center gap-6 mt-4 border-t border-slate-50 pt-4">
            {data.population.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: POPULATION_COLORS[index] }}></span>
                <span className="text-slate-600 font-medium">{entry.name}: <span className="font-bold text-slate-800 ml-1">{entry.value}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Year Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-bold text-slate-800 mb-2 w-full text-left flex items-center gap-2">
            <FiCalendar className="text-emerald-500" /> Students by Year
          </h2>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={data.yearDistribution}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.yearDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={YEAR_COLORS[index % YEAR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full flex justify-center flex-wrap gap-4 mt-4 border-t border-slate-50 pt-4">
            {data.yearDistribution?.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: YEAR_COLORS[index] }}></span>
                <span className="text-slate-600 font-medium">{entry.name}: <span className="font-bold text-slate-800 ml-1">{entry.value}</span></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ROW 3: Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Average Attendance by Branch */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FiCheckCircle className="text-purple-500"/> Average Attendance by Branch
          </h2>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar isAnimationActive={false} name="Avg Attendance %" dataKey="avgAttendance" fill={COLORS.purple} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staffing Ratios */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Staffing Ratios (Students vs. Faculty)</h2>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingBottom: '20px' }}/>
                <Bar isAnimationActive={false} name="Total Students" dataKey="students" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={25} />
                <Bar isAnimationActive={false} name="Total Faculty" dataKey="faculty" fill={COLORS.secondary} radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;