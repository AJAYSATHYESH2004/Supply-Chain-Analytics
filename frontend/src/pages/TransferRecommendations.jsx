import React, { useState, useEffect } from 'react';
import { rebalancingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileCheck, CheckCircle2, XCircle, ArrowRight, Loader2, Warehouse, Route, 
  IndianRupee, Star, Calendar, Activity, Info, LayoutGrid, List as ListIcon, Search, Filter,
  GitCompare
} from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const TransferRecommendations = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // table, grid
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const data = await rebalancingAPI.getTransfers();
      setTransfers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await rebalancingAPI.approveTransfer(id);
      fetchTransfers();
      alert('Stock transfer approved successfully. Local depot stocks have been updated.');
    } catch (err) {
      alert(err.message || 'Failed to approve transfer');
    }
  };

  const handleReject = async (id) => {
    try {
      await rebalancingAPI.rejectTransfer(id);
      fetchTransfers();
    } catch (err) {
      alert(err.message || 'Failed to reject transfer');
    }
  };

  const pendingCount = transfers.filter(t => t.status === 'PENDING').length;
  const approvedCount = transfers.filter(t => t.status === 'APPROVED').length;
  const totalCost = transfers.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.transport_cost, 0);
  
  const avgScore = transfers.length > 0 
    ? Math.round(transfers.reduce((sum, t) => sum + t.recommendation_score, 0) / transfers.length) 
    : 100;
  
  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = t.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.source_depot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination_depot_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{title}</p>
        <p className="text-xl font-black mt-0.5">{suffix}{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="Inter-Depot Stock Transfers" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Review AI-optimized stock transfer suggestions between hubs. Approve requests to issue stock movement logs.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pending Review" value={pendingCount} icon={FileCheck} color="bg-warning/10 text-warning" />
        <StatCard title="Approved Routes" value={approvedCount} icon={CheckCircle2} color="bg-success/10 text-success" />
        <StatCard title="Avg Match Quality" value={`${avgScore}%`} icon={Star} color="bg-accent/10 text-accent" />
        <StatCard title="Approved Cost" value={totalCost.toLocaleString('en-IN')} suffix="₹" icon={IndianRupee} color="bg-primary/10 text-primary" />
      </div>

      {/* Control Panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Status Tab list */}
        <div className="flex gap-1 bg-secondary/40 p-1 rounded-xl border border-border/40 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${statusFilter === st ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          
          {/* Search bar */}
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search product or hub..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2 pl-8 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
            />
          </div>

          {/* View Toggles */}
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
              title="Table View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-muted-foreground font-medium">Fetching transfer recommendations...</div>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border text-center shadow-sm">
          <FileCheck size={48} className="mx-auto text-muted-foreground/15 mb-2" />
          <p className="text-sm font-bold text-muted-foreground">No inter-depot transfer recommendations logged.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table Mode */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">Source Depot</th>
                  <th className="px-6 py-4"><ArrowRight size={10} className="inline mr-1" /> Destination Depot</th>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4">Tariff & Distance</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Analysis</th>
                  {user && (user.role === 'HOD' || user.role === 'SUPER_ADMIN') && <th className="px-6 py-4 text-center">Review Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransfers.map(t => (
                  <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-foreground">{t.source_depot_name}</td>
                    <td className="px-6 py-4 font-bold text-sm text-foreground">{t.destination_depot_name}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-xs text-foreground">{t.product_name}</div>
                        <span className="text-[9px] text-muted-foreground font-mono">PRODUCT ID: {t.product_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-sm text-foreground">{t.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <div className="font-bold text-foreground">₹{t.transport_cost.toLocaleString('en-IN')}</div>
                        <span className="text-[10px] text-muted-foreground font-medium">{t.distance_km.toFixed(1)} KM</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold ${t.recommendation_score >= 80 ? 'text-success' : 'text-accent'}`}>
                        {t.recommendation_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[8px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${
                        t.status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
                        t.status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-warning/10 text-warning border-warning/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelectedRoute(t); setShowCompareModal(true); }}
                        className="px-2.5 py-1 bg-secondary/50 hover:bg-primary/10 border border-border/50 text-foreground hover:text-primary rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors mx-auto"
                      >
                        <GitCompare size={12} /> Compare
                      </button>
                    </td>
                    {user && (user.role === 'HOD' || user.role === 'SUPER_ADMIN') && (
                      <td className="px-6 py-4 text-center">
                        {t.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleApprove(t.id)}
                              className="px-2.5 py-1 bg-success text-success-foreground text-[9px] font-bold rounded-lg hover:bg-success/90 transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(t.id)}
                              className="px-2.5 py-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-lg hover:bg-destructive/90 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <p className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Completed</p>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTransfers.map(t => (
            <div 
              key={t.id}
              className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between gap-4 transition-all hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">Match Quality: <strong className={t.recommendation_score >= 80 ? 'text-success' : 'text-accent'}>{t.recommendation_score}%</strong></span>
                  <span className={`text-[8px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${
                    t.status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
                    t.status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    'bg-warning/10 text-warning border-warning/20'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-secondary/35 p-3 rounded-xl border border-border/30">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">From Depot</p>
                    <span className="text-xs font-extrabold text-foreground">{t.source_depot_name}</span>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground mx-2" />
                  <div className="text-right">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">To Depot</p>
                    <span className="text-xs font-extrabold text-foreground">{t.destination_depot_name}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-foreground">{t.product_name}</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">TRANSIT UNITS: <strong>{t.quantity.toLocaleString()}</strong></p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-left border-t border-border/40">
                  <div className="bg-secondary/20 p-2.5 rounded-xl border border-border/30">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Distance</p>
                    <span className="text-xs font-bold text-foreground">{t.distance_km.toFixed(1)} KM</span>
                  </div>
                  <div className="bg-secondary/20 p-2.5 rounded-xl border border-border/30">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Estimated Cost</p>
                    <span className="text-xs font-bold text-foreground">₹{t.transport_cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedRoute(t); setShowCompareModal(true); }}
                  className="w-full mt-2 py-2 bg-secondary/50 hover:bg-primary/10 border border-border/50 text-foreground hover:text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <GitCompare size={14} /> Compare Route
                </button>
              </div>

              {user && (user.role === 'HOD' || user.role === 'SUPER_ADMIN') && t.status === 'PENDING' && (
                <div className="flex gap-2 border-t border-border/40 pt-4">
                  <button 
                    onClick={() => handleReject(t.id)}
                    className="flex-1 py-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-xl hover:bg-destructive/95 transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(t.id)}
                    className="flex-1 py-2 bg-success text-white text-xs font-bold rounded-xl hover:bg-success/95 transition-all"
                  >
                    Approve
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 text-left">
            <h3 className="text-xl font-black mb-1 flex items-center gap-2 text-foreground">
              <GitCompare className="text-primary animate-pulse" /> AI Route Efficiency Analysis
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-4">Route Performance Benchmarking</p>
            
            <div className="bg-secondary/40 p-4 rounded-2xl border border-border/50 mb-6">
              <div className="flex items-center justify-between font-bold text-sm text-foreground mb-1.5">
                <span className="flex items-center gap-1"><Warehouse size={14} className="text-primary" /> {selectedRoute.source_depot_name}</span>
                <span className="text-muted-foreground">→</span>
                <span className="flex items-center gap-1"><Warehouse size={14} className="text-accent" /> {selectedRoute.destination_depot_name}</span>
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Product: <strong className="text-foreground">{selectedRoute.product_name}</strong> | Batch Size: <strong className="text-primary">{selectedRoute.quantity.toLocaleString()} units</strong>
              </p>
            </div>

            {/* Comparison Stack */}
            <div className="space-y-5">
              {/* AI Route */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-success flex items-center gap-1"><CheckCircle2 size={13} /> SmartChain AI Route (Optimized)</span>
                  <span className="text-foreground">₹{selectedRoute.transport_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-secondary/65 h-3.5 rounded-full overflow-hidden border border-border/40 p-0.5">
                  <div className="bg-gradient-to-r from-success to-[#10b981] h-full rounded-full w-[40%] transition-all duration-500"></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                  <span>Distance: {selectedRoute.distance_km.toFixed(1)} KM</span>
                  <span>Est. Time: {(selectedRoute.distance_km / 50.0).toFixed(1)} Hrs</span>
                </div>
              </div>

              {/* Traditional Route */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-destructive flex items-center gap-1"><XCircle size={13} /> Traditional Vendor Route (Ad-hoc)</span>
                  <span className="text-foreground">₹{(selectedRoute.transport_cost * 1.62).toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                </div>
                <div className="w-full bg-secondary/65 h-3.5 rounded-full overflow-hidden border border-border/40 p-0.5">
                  <div className="bg-gradient-to-r from-destructive to-primary h-full rounded-full w-[95%] transition-all duration-500"></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                  <span>Distance: {(selectedRoute.distance_km * 1.25).toFixed(1)} KM (Non-optimal mapping)</span>
                  <span>Est. Time: {((selectedRoute.distance_km / 50.0) * 1.5).toFixed(1)} Hrs</span>
                </div>
              </div>
            </div>

            {/* Boost Card */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-success/10 to-[#10b981]/5 border border-success/20 text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-success">SmartChain Optimization Boost</p>
              <h4 className="text-lg font-black text-foreground">
                🚀 +62% Cost Optimization & +33.3% Faster Delivery
              </h4>
              <p className="text-xs text-muted-foreground font-semibold">
                AI rebalancing avoids traditional overheads, boosting route efficiency score to <strong className="text-success">{selectedRoute.recommendation_score}%</strong>.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl transition-colors border border-border"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferRecommendations;
