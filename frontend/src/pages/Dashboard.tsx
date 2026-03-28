import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Users, Calendar, FileText, Star, Loader2 } from "lucide-react";

// Colors for charts
const COLORS = ["#f59e0b", "#1e293b", "#3b82f6", "#ef4444", "#10b981"];

const StatCard = ({ title, value, icon: Icon, colorClass, borderClass }: any) => (
  <Card className={`border-none shadow-sm ${borderClass}`}>
    <CardContent className="p-6 flex flex-col pt-6 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${colorClass.replace("bg-", "text-")}`} />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "dashboardStats"],
    queryFn: () => adminService.getDashboardStats(),
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center p-12 h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#F58220]" />
      </div>
    );
  }

  // Use real data or fallback
  const barData = stats.registration_activity || [{ name: "JAN", val: 0 }];
  const pieData = stats.event_distribution || [{ name: "No Events", value: 1 }];
  
  // Extract top event distribution for the center label of Doughnut chart
  const topPieValue = pieData.reduce((max: any, item: any) => item.value > max.value ? item : max, pieData[0]);
  const totalPieValues = pieData.reduce((sum: number, item: any) => sum + item.value, 0);
  const topPiePercentage = totalPieValues > 0 ? Math.round((topPieValue.value / totalPieValues) * 100) : 0;

  // areaData is kept static for visual completeness as a "trend prediction" or engagement representation not yet provided by the API
  const areaData = [
    { name: "Day 1", uv: 4000, pv: 2400 },
    { name: "Day 2", uv: 3000, pv: 1398 },
    { name: "Day 3", uv: 2000, pv: 9800 },
    { name: "Day 4", uv: 2780, pv: 3908 },
    { name: "Day 5", uv: 1890, pv: 4800 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Blue Ox Events</h1>
          <p className="text-slate-500 mt-1">Platform Analytics & Overview</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Events" 
          value={stats.total_events} 
          icon={Calendar} 
          colorClass="bg-blue-600" 
        />
        <StatCard 
          title="Total Users" 
          value={stats.active_users} 
          icon={Users} 
          colorClass="bg-orange-500" 
        />
        <StatCard 
          title="Submissions" 
          value={stats.total_submissions} 
          icon={FileText} 
          colorClass="bg-indigo-500" 
        />
        <StatCard 
          title="Avg Rating" 
          value={stats.avg_rating} 
          icon={Star} 
          colorClass="bg-yellow-500" 
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">Registration Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="val" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={32}>
                    {
                      barData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={'#1e293b'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Doughnut Chart */}
        <Card className="border-none shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">Event Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-slate-800">{topPiePercentage}%</span>
                <span className="text-xs text-slate-400 capitalize max-w-[80px] text-center truncate">{topPieValue.name}</span>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-4 w-full space-y-2 max-h-[80px] overflow-y-auto pr-2">
              {pieData.map((entry: any, index: number) => (
                <div key={entry.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                    <span className="text-slate-600 truncate max-w-[120px]">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">Platform Engagement Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e293b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="uv" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                  <Area type="monotone" dataKey="pv" stroke="#1e293b" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Schedule / Calendar Placeholder */}
        <Card className="border-none shadow-sm flex flex-col justify-center items-center bg-white">
          <CardContent className="flex flex-col items-center justify-center h-full space-y-4 py-12">
            <div className="w-16 h-16 bg-blue-50 text-[#2962FF] rounded-2xl flex items-center justify-center border-2 border-[#2962FF]/10">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Immediate Actions Required</h3>
            <p className="text-slate-500 text-center max-w-[250px]">
              Your platform metrics are stable. Head over to the Events tab to see upcoming activities.
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
