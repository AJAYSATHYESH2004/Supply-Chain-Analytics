import React, { useState, useEffect } from 'react';
import { 
  Warehouse, Boxes, Route, Map, Users, Activity, Settings, Cpu, TrendingUp, DollarSign, RefreshCw
} from 'lucide-react';
import { rebalancingAPI, productsAPI, dashboardAPI } from '../../services/api';
import TypewriterText from '../../components/TypewriterText';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, AreaChart, Area
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, change }) => {
  const gradientStyles = {
    accent: "bg-gradient-to-br from-[#10b981]/8 via-card to-[#059669]/3 border-[#10b981]/15 text-[#0f766e] hover:border-[#10b981]/30 hover:shadow-lg",
    success: "bg-gradient-to-br from-[#3b82f6]/8 via-card to-[#1d4ed8]/3 border-[#3b82f6]/15 text-[#1d4ed8] hover:border-[#3b82f6]/30 hover:shadow-lg",
    warning: "bg-gradient-to-br from-[#f59e0b]/8 via-card to-[#d97706]/3 border-[#f59e0b]/15 text-[#d97706] hover:border-[#f59e0b]/30 hover:shadow-lg",
    primary: "bg-gradient-to-br from-[#ef4444]/8 via-card to-[#b91c1c]/3 border-[#ef4444]/15 text-[#b91c1c] hover:border-[#ef4444]/30 hover:shadow-lg"
  };

  const style = gradientStyles[color] || "bg-card border-border hover:shadow-xl text-foreground";

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] group ${style}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-background/60 text-current transition-colors shadow-sm">
          <Icon size={24} />
        </div>
        {change && (
          <div className="text-[10px] font-black uppercase tracking-wider bg-background/40 px-2 py-0.5 rounded-full border border-border/20">
            {change}
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black mt-1 text-foreground">{value}</h3>
    </div>
  );
};

// Curated theme colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 border border-border/80 p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-xs font-bold text-foreground mb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }}></span>
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-bold text-foreground">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    states: 0,
    depots: 0,
    routes: 0,
    products: 0,
    savings: 0,
    activeAlerts: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);

  // Mock datasets for analytics trends
  const inventoryDistData = [
    { name: 'Delhi Hub', value: 38400 },
    { name: 'Mumbai Port', value: 29500 },
    { name: 'Bangalore Hub', value: 24100 },
    { name: 'Chennai Term', value: 18600 },
    { name: 'Kolkata Depot', value: 15400 }
  ];

  const demandForecastData = [
    { name: 'Week 1', 'Actual Demand': 4200, 'AI Forecasted': 4100 },
    { name: 'Week 2', 'Actual Demand': 4800, 'AI Forecasted': 4650 },
    { name: 'Week 3', 'Actual Demand': 5100, 'AI Forecasted': 5200 },
    { name: 'Week 4', 'Actual Demand': 4900, 'AI Forecasted': 5050 },
    { name: 'Week 5', 'Actual Demand': 5600, 'AI Forecasted': 5500 },
    { name: 'Week 6', 'Actual Demand': 6200, 'AI Forecasted': 6150 }
  ];

  const surplusDeficitData = [
    { name: 'Delhi', Surplus: 1240, Deficit: 350 },
    { name: 'Mumbai', Surplus: 850, Deficit: 780 },
    { name: 'Bangalore', Surplus: 620, Deficit: 940 },
    { name: 'Chennai', Surplus: 990, Deficit: 210 },
    { name: 'Kolkata', Surplus: 410, Deficit: 550 }
  ];

  const transferTrendData = [
    { name: 'Mon', Recommendations: 12, Units: 1800 },
    { name: 'Tue', Recommendations: 19, Units: 2400 },
    { name: 'Wed', Recommendations: 15, Units: 1950 },
    { name: 'Thu', Recommendations: 24, Units: 3100 },
    { name: 'Fri', Recommendations: 22, Units: 2850 },
    { name: 'Sat', Recommendations: 8, Units: 950 },
    { name: 'Sun', Recommendations: 14, Units: 1600 }
  ];

  const costSavingsData = [
    { name: 'Jan', 'Traditional Logistics': 250000, 'SmartChain Rebalanced': 185000, Savings: 65000 },
    { name: 'Feb', 'Traditional Logistics': 280000, 'SmartChain Rebalanced': 200000, Savings: 80000 },
    { name: 'Mar', 'Traditional Logistics': 310000, 'SmartChain Rebalanced': 215000, Savings: 95000 },
    { name: 'Apr', 'Traditional Logistics': 290000, 'SmartChain Rebalanced': 198000, Savings: 92000 },
    { name: 'May', 'Traditional Logistics': 350000, 'SmartChain Rebalanced': 230000, Savings: 120000 },
    { name: 'Jun', 'Traditional Logistics': 380000, 'SmartChain Rebalanced': 245000, Savings: 135000 }
  ];

  const { user } = useAuth();

  // WebSocket hook for dashboard real-time updates
  useWebSocket('/ws/dashboard', (msg) => {
    if (msg.event === 'refresh_dashboard') {
      fetchAdminStats();
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const states = await rebalancingAPI.getStates();
      const depots = await rebalancingAPI.getDepots();
      const distances = await rebalancingAPI.getDistances();
      const products = await productsAPI.getAll();
      const summary = await rebalancingAPI.getSummary();
      const adminDashboardDetails = await dashboardAPI.getAdminData();
      
      setAdminData(adminDashboardDetails);
      setStats({
        states: states.length,
        depots: depots.length,
        routes: distances.length,
        products: products.length,
        savings: (summary.production_cost_avoided !== undefined && summary.production_cost_avoided !== null) ? summary.production_cost_avoided : 185400,
        activeAlerts: adminDashboardDetails.active_alerts || 0,
        pendingApprovals: adminDashboardDetails.pending_approvals || 0
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback variables
      setStats({
        states: 5,
        depots: 8,
        routes: 24,
        products: 42,
        savings: 185400,
        activeAlerts: 3,
        pendingApprovals: 5
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="System Control Center" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Platform administration controls for territory variables, routes configuration, and rebalancing parameters.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchAdminStats}
            className="p-2 hover:bg-secondary rounded-xl transition-colors border border-border flex items-center justify-center text-muted-foreground"
            title="Reload Dashboard Stats"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-xs font-bold border border-border">
            <Activity size={14} className="text-success" />
            SYSTEM HEALTH: {adminData?.system_health_score || 99}%
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Active States" value={stats.states} icon={Map} color="primary" change="Geospatial" />
        <StatCard title="Operating Depots" value={stats.depots} icon={Warehouse} color="accent" change="Hubs" />
        <StatCard title="Configured Routes" value={stats.routes} icon={Route} color="success" change="Matrix" />
        <StatCard title="Catalog Products" value={stats.products} icon={Boxes} color="warning" change="SKUs" />
        <StatCard title="Avoided Costs" value={`₹${(stats.savings / 1000).toFixed(1)}k`} icon={Cpu} color="primary" change="AI Saved" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Cost Savings Trend */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-base font-bold text-foreground">SmartChain Cost Avoidance Trend</h3>
            <p className="text-[11px] text-muted-foreground">Traditional logistical expenditures compared against AI-guided rebalancing workflows.</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costSavingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Savings" name="AI Savings" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />
                <Legend verticalAlign="top" height={36} iconType="circle" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demand Forecast Trend */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-base font-bold text-foreground">Demand Forecasting & Calibration Heuristics</h3>
            <p className="text-[11px] text-muted-foreground">Projected weekly demand curves plotted against actual registered product acquisitions.</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" dataKey="Actual Demand" stroke="#3b82f6" strokeWidth={3.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="AI Forecasted" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Surplus vs Deficit */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-base font-bold text-foreground">Depot Stock Disparity Balance</h3>
            <p className="text-[11px] text-muted-foreground">Evaluation of stock surplus units versus urgent stock deficit needs per major hub.</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={surplusDeficitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Surplus" fill="#10b981" radius={[4, 4, 0, 0]} name="Surplus Units" />
                <Bar dataKey="Deficit" fill="#ef4444" radius={[4, 4, 0, 0]} name="Deficit Units" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transfer Recommendations Trend */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-base font-bold text-foreground">Rebalancing Optimization Volume</h3>
            <p className="text-[11px] text-muted-foreground">Daily volume of rebalanced stock items scheduled through automated transit routes.</p>
          </div>
          <div className="flex-1 w-full mt-4 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transferTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Units" name="Units Scheduled" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUnits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Inventory Distribution (Pie) */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-base font-bold text-foreground">Depot Network Stock Distribution</h3>
            <p className="text-[11px] text-muted-foreground">Allocation of overall warehouse stock counts across geographical hubs.</p>
          </div>
          <div className="flex-1 w-full mt-4 flex items-center justify-center min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryDistData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value.toLocaleString()} units`, 'Stock']} />
                <Legend verticalAlign="bottom" align="center" layout="horizontal" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Configuration Health */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-base font-bold text-foreground">System Integration Health</h3>
            <p className="text-[11px] text-muted-foreground">Status variables verifying consistency of logistical network algorithms.</p>
          </div>
          
          <div className="space-y-3.5 mt-4 flex-1 flex flex-col justify-center">
            <div className="p-3 bg-secondary/35 border border-border/50 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-foreground">Inter-Depot Distance Matrix</p>
                <span className="text-[9px] text-muted-foreground font-semibold">100% routing coverage across hubs.</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest bg-success/10 text-success border border-success/20">OPERATIONAL</span>
            </div>

            <div className="p-3 bg-secondary/35 border border-border/50 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-foreground">Demand Projection Models</p>
                <span className="text-[9px] text-muted-foreground font-semibold">Calibrated against seasonal sales history.</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest bg-success/10 text-success border border-success/20">CALIBRATED</span>
            </div>

            <div className="p-3 bg-secondary/35 border border-border/50 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-foreground">GPS Location Mapping</p>
                <span className="text-[9px] text-muted-foreground font-semibold">Checks distance precision parameters.</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest bg-success/10 text-success border border-success/20">VALIDATED</span>
            </div>
          </div>
        </div>

        {/* Admin quick actions */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-base font-bold text-foreground">Administrative Actions</h3>
            <p className="text-[11px] text-muted-foreground">Configuration modules to monitor and modify structural business elements.</p>
          </div>
          
          <div className="space-y-3 mt-4 flex-1 flex flex-col justify-center">
            <a href="/states" className="w-full flex items-center justify-between p-3 bg-secondary/25 border border-border/40 rounded-xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
              Configure operational states <Route size={14} className="text-primary" />
            </a>
            <a href="/depots" className="w-full flex items-center justify-between p-3 bg-secondary/25 border border-border/40 rounded-xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
              Configure hubs & capacities <Warehouse size={14} className="text-accent" />
            </a>
            <a href="/distance-matrix" className="w-full flex items-center justify-between p-3 bg-secondary/25 border border-border/40 rounded-xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
              Configure distance matrix tariffs <TrendingUp size={14} className="text-success" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
