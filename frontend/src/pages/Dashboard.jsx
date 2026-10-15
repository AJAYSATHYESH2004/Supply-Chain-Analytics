import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Package, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  IndianRupee, CheckCircle, Warehouse, Cpu, ArrowRight, Activity, Zap
} from 'lucide-react';
import { rebalancingAPI, alertsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TypewriterText from '../components/TypewriterText';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const StatCard = ({ title, value, change, icon: Icon, color, prefix = '' }) => {
  const gradientStyles = {
    accent: "bg-gradient-to-br from-[#10b981]/8 via-card to-[#059669]/3 border-[#10b981]/15 hover:from-[#10b981]/15 hover:to-[#059669]/10 hover:border-[#10b981]/30 hover:shadow-lg hover:shadow-[#10b981]/5 text-[#0f766e]",
    success: "bg-gradient-to-br from-[#3b82f6]/8 via-card to-[#1d4ed8]/3 border-[#3b82f6]/15 hover:from-[#3b82f6]/15 hover:to-[#1d4ed8]/10 hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-[#3b82f6]/5 text-[#1d4ed8]",
    warning: "bg-gradient-to-br from-[#f59e0b]/8 via-card to-[#d97706]/3 border-[#f59e0b]/15 hover:from-[#f59e0b]/15 hover:to-[#d97706]/10 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5 text-[#d97706]",
    primary: "bg-gradient-to-br from-[#ef4444]/8 via-card to-[#b91c1c]/3 border-[#ef4444]/15 hover:from-[#ef4444]/15 hover:to-[#b91c1c]/10 hover:border-[#ef4444]/30 hover:shadow-lg hover:shadow-[#ef4444]/5 text-[#b91c1c]"
  };

  const style = gradientStyles[color] || "bg-card border-border hover:shadow-xl text-foreground";

  return (
    <div className={`p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] group ${style}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-background/60 text-current transition-colors shadow-sm">
          <Icon size={24} />
        </div>
        {change && (
          <div className="flex items-center text-xs font-black tracking-wide text-success bg-background/50 px-2 py-0.5 rounded-full border border-border/20">
            <ArrowUpRight size={14} className="mr-0.5" />
            {change}
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black mt-1 text-foreground">{prefix}{value}</h3>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const savingsData = summary?.savings_over_time || [];
  const depotDistributionData = summary?.depot_stock_distribution || [];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const summData = await rebalancingAPI.getSummary();
      setSummary(summData);
      const transfersData = await rebalancingAPI.getTransfers();
      setTransfers(transfersData.slice(0, 3));
      const alertsData = await alertsAPI.getAll();
      setAlerts(alertsData.slice(0, 3));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <TypewriterText text="Intelligent Inventory Rebalancing Hub" />
          </h1>
          <p className="text-muted-foreground mt-1">Multi-depot stock monitoring, logistics cost minimization, and production avoidance metrics.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs hover:bg-secondary/80 transition-colors border border-border"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-muted-foreground font-medium">Loading command center...</div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Network Stock" value={summary.total_inventory.toLocaleString()} icon={Package} color="accent" change="Active Net" />
              <StatCard title="Surplus Stock" value={summary.surplus_units.toLocaleString()} icon={ArrowUpRight} color="success" />
              <StatCard title="Deficit Shortage" value={summary.deficit_units.toLocaleString()} icon={ArrowDownRight} color="primary" />
              <StatCard title="Total Savings" value={summary.net_savings.toLocaleString('en-IN')} prefix="₹" icon={IndianRupee} color="warning" change="Avoided Prod" />
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Savings Over Time */}
            <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg">AI Optimization Savings</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Net financial savings achieved by replacing raw production with depot transfers.</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsData}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                    />
                    <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Depot Stock Distribution */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Hub Distribution</h3>
                <p className="text-xs text-muted-foreground mb-6">Proportional stock allocation across the primary hub warehouses.</p>
              </div>
              <div className="h-[240px] w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={depotDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {depotDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  {depotDistributionData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="text-[10px] text-muted-foreground truncate font-bold uppercase">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent recommended transfers */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Optimized Transfer Actions</h3>
                <p className="text-xs text-muted-foreground mb-6">Latest transfer suggestions waiting for Supply Chain Head (HOD) approval.</p>
              </div>
              
              <div className="space-y-4">
                {transfers.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3.5 bg-secondary/20 rounded-2xl border border-border/40">
                    <div>
                      <p className="text-xs font-black text-foreground">{t.product_name}</p>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{t.source_depot_name} → {t.destination_depot_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-primary">{t.quantity.toLocaleString()} units</p>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{t.status}</span>
                    </div>
                  </div>
                ))}
                {transfers.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-xs font-semibold">
                    No transfers pending. Run the rebalancing calculations!
                  </div>
                )}
              </div>
            </div>

            {/* System notifications/alerts */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
              <h3 className="font-bold text-lg mb-1">Rebalancing Alerts</h3>
              <p className="text-xs text-muted-foreground mb-6">Real-time alerts regarding stock deficits, surpluses, and reorder triggers.</p>
              
              <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${alert.priority === 'CRITICAL' || alert.priority === 'HIGH' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground truncate max-w-[200px]">{alert.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{alert.message}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${alert.priority === 'CRITICAL' || alert.priority === 'HIGH' ? 'bg-destructive/15 text-destructive border border-destructive/20' : 'bg-accent/15 text-accent border border-accent/20'}`}>
                          {alert.priority}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-muted-foreground text-xs font-semibold">
                    No active alerts. Operational levels are balanced!
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
