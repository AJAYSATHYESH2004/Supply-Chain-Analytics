import React, { useState, useEffect } from 'react';
import { rebalancingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  GitCompare, Play, Loader2, TrendingUp, IndianRupee, AlertTriangle, CheckCircle, 
  Warehouse, ArrowUpRight, ArrowDownRight, ArrowRight, Activity, Cpu, Calendar 
} from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const Rebalancing = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [surpluses, setSurpluses] = useState([]);
  const [deficits, setDeficits] = useState([]);
  const [productionRecs, setProductionRecs] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const summData = await rebalancingAPI.getSummary();
      setSummary(summData);
      
      const surplusDeficit = await rebalancingAPI.getSurplusDeficit();
      setSurpluses(surplusDeficit.surpluses || []);
      setDeficits(surplusDeficit.deficits || []);
      
      // We run a mock trigger or fetch calculations results
      const prodData = await rebalancingAPI.getProduction();
      setProductionRecs(prodData);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRunRebalancing = async () => {
    setCalculating(true);
    try {
      const res = await rebalancingAPI.calculate();
      setSurpluses(res.surpluses || []);
      setDeficits(res.deficits || []);
      
      // Refresh summary and production lists
      const summData = await rebalancingAPI.getSummary();
      setSummary(summData);
      const prodData = await rebalancingAPI.getProduction();
      setProductionRecs(prodData);
      
      alert('AI Rebalancing optimization completed successfully!');
    } catch (err) {
      alert(err.message || 'Optimization failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleApproveProduction = async (id) => {
    try {
      await rebalancingAPI.approveProduction(id);
      fetchData();
      alert('Production recommendation approved and ordered.');
    } catch (err) {
      alert(err.message || 'Failed to approve production');
    }
  };

  const handleRejectProduction = async (id) => {
    try {
      await rebalancingAPI.rejectProduction(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to reject production');
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color, prefix = '' }) => {
    const colorStyles = {
      accent: "bg-gradient-to-br from-[#10b981]/5 via-card to-[#059669]/3 border-[#10b981]/15 text-[#0f766e] hover:border-[#10b981]/30 hover:shadow-lg",
      success: "bg-gradient-to-br from-[#3b82f6]/5 via-card to-[#1d4ed8]/3 border-[#3b82f6]/15 text-[#1d4ed8] hover:border-[#3b82f6]/30 hover:shadow-lg",
      warning: "bg-gradient-to-br from-[#f59e0b]/5 via-card to-[#d97706]/3 border-[#f59e0b]/15 text-[#d97706] hover:border-[#f59e0b]/30 hover:shadow-lg",
      primary: "bg-gradient-to-br from-[#ef4444]/5 via-card to-[#b91c1c]/3 border-[#ef4444]/15 text-[#b91c1c] hover:border-[#ef4444]/30 hover:shadow-lg"
    };
    const style = colorStyles[color] || "bg-card border-border hover:shadow-xl text-foreground";

    return (
      <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] group ${style}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-background/60 shadow-sm text-current">
            <Icon size={20} />
          </div>
          {change && (
            <span className="text-[10px] font-black uppercase bg-background/40 px-2 py-0.5 rounded-full border border-border/20 text-current flex items-center gap-0.5">
              <ArrowUpRight size={10} /> {change}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black mt-1 text-foreground">{prefix}{value}</h3>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="AI Rebalancing Engine" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Optimize inter-depot stock matching to avoid unnecessary production and minimize shipping overheads.</p>
        </div>
        <button 
          onClick={handleRunRebalancing}
          disabled={calculating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {calculating ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Running AI Optimizer...
            </>
          ) : (
            <>
              <Play className="fill-current" size={16} /> Run AI Rebalancing Engine
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-muted-foreground font-medium">Fetching rebalancing summaries...</div>
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Production Cost Avoided" value={summary.production_cost_avoided.toLocaleString('en-IN')} prefix="₹" icon={Cpu} color="accent" change="AI Optimized" />
              <StatCard title="Estimated Logistics Cost" value={summary.logistics_cost.toLocaleString('en-IN')} prefix="₹" icon={TrendingUp} color="warning" />
              <StatCard title="Avoided Production Units" value={summary.units_saved.toLocaleString()} icon={CheckCircle} color="success" />
              <StatCard title="Net Supply Chain Savings" value={summary.net_savings.toLocaleString('en-IN')} prefix="₹" icon={IndianRupee} color="primary" change="Direct Savings" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Surplus Depots */}
            <div className="bg-card p-6 border border-border rounded-3xl shadow-sm flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Active Surplus Depots</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Inventory levels that exceed required safety stocks.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-success/15 text-success border border-success/20 uppercase">Available Stock</span>
              </div>
              
              <div className="overflow-y-auto max-h-[350px] no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-muted-foreground uppercase tracking-widest font-black border-b border-border pb-2">
                      <th className="pb-3"><Warehouse size={10} className="inline mr-1" /> Depot</th>
                      <th className="pb-3">Product</th>
                      <th className="pb-3 text-right">Stock (Surplus)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {surpluses.length > 0 ? surpluses.map((s, idx) => (
                      <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                        <td className="py-3 font-semibold text-xs text-foreground">{s.depot_name}</td>
                        <td className="py-3 font-semibold text-xs text-muted-foreground truncate max-w-[150px]">{s.product_name}</td>
                        <td className="py-3 font-black text-xs text-success text-right">{s.stock} <span className="text-[10px] text-muted-foreground">(+{s.surplus})</span></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-xs text-muted-foreground font-semibold">
                          No surplus records logged. Run calculation engine.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deficit Depots */}
            <div className="bg-card p-6 border border-border rounded-3xl shadow-sm flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Active Shortage Depots</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Depots failing to meet weekly demand thresholds.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-destructive/15 text-destructive border border-destructive/20 uppercase">Shortfalls</span>
              </div>
              
              <div className="overflow-y-auto max-h-[350px] no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-muted-foreground uppercase tracking-widest font-black border-b border-border pb-2">
                      <th className="pb-3"><Warehouse size={10} className="inline mr-1" /> Depot</th>
                      <th className="pb-3">Product</th>
                      <th className="pb-3 text-right">Stock (Deficit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deficits.length > 0 ? deficits.map((d, idx) => (
                      <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                        <td className="py-3 font-semibold text-xs text-foreground">{d.depot_name}</td>
                        <td className="py-3 font-semibold text-xs text-muted-foreground truncate max-w-[150px]">{d.product_name}</td>
                        <td className="py-3 font-black text-xs text-destructive text-right">{d.stock} <span className="text-[10px] text-muted-foreground">(-{d.deficit})</span></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-xs text-muted-foreground font-semibold">
                          No stock shortage records logged. Run calculation engine.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Production Assistant Recommendations */}
          <div className="bg-card p-6 border border-border rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Production Planning Recommendations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Recommendations generated only when nearby depots cannot supply needed stock via transfers.</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-accent/15 text-accent border border-accent/20 uppercase">Production Plans</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary/20 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                    <th className="px-6 py-4">Transfer From / Origin</th>
                    <th className="px-6 py-4">Destination Depot</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4 text-center">Batch Quantity</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Est. Cost</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    {user && (user.role === 'HOD' || user.role === 'SUPER_ADMIN') && <th className="px-6 py-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productionRecs.map(rec => (
                    <tr key={rec.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider bg-primary/10 text-primary border border-primary/20 uppercase">
                          Factory Production
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-foreground">
                        {rec.depot_name}
                        {rec.state_name && (
                          <span className="text-[10px] text-muted-foreground block font-medium uppercase mt-0.5">
                            {rec.state_name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{rec.product_name}</td>
                      <td className="px-6 py-4 font-black text-sm text-foreground text-center">{rec.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate" title={rec.reason}>{rec.reason || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-xs text-foreground">₹{rec.production_cost.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${
                          rec.status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
                          rec.status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      {user && (user.role === 'HOD' || user.role === 'SUPER_ADMIN') && (
                        <td className="px-6 py-4">
                          {rec.status === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleApproveProduction(rec.id)}
                                className="px-2.5 py-1 bg-success text-success-foreground text-[9px] font-bold rounded-lg hover:bg-success/90 transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleRejectProduction(rec.id)}
                                className="px-2.5 py-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-lg hover:bg-destructive/90 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <p className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Processed</p>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {productionRecs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-muted-foreground text-xs font-semibold">
                        No production recommendations pending approval.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Rebalancing;
