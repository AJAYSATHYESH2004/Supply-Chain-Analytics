import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, Brain, TrendingDown,
  RefreshCw, Zap, ShieldCheck, AlertTriangle,
  Package, Sliders, ShieldAlert, Sparkles, MoveRight
} from 'lucide-react';
import axios from 'axios';
import TypewriterText from '../components/TypewriterText';

const CATEGORIES = [
  "Beverages", "Dairy", "Foods", "Hair Care", "Hair Color", 
  "Home Care", "Men's Care", "Professional Care", "Skin Care", "Snacks"
];

const Forecasting = () => {
  const [stateData, setStateData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'HEALTHY', 'DEFICIT'
  const [isSurplusModalOpen, setIsSurplusModalOpen] = useState(false);

  useEffect(() => {
    fetchStateIntelligence();
  }, []);

  const fetchStateIntelligence = async () => {
    try {
      setLoading(true);
      const [intelRes, insightsRes] = await Promise.all([
        axios.get('/api/v1/forecasting/state-intelligence'),
        axios.get('/api/v1/forecasting/insights')
      ]);
      setStateData(intelRes.data);
      setInsights(insightsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching state demand intelligence:', error);
      setLoading(false);
    }
  };

  const handleRetrainModels = async () => {
    try {
      setRetraining(true);
      await axios.post('/api/v1/forecasting/train-models');
      await fetchStateIntelligence();
      setRetraining(false);
    } catch (error) {
      console.error('Error retraining AI models:', error);
      setRetraining(false);
    }
  };

  // Helper to extract category demand for the heatmap
  const getCategoryDemand = (state, category) => {
    const found = state.heatmap_data?.find(item => item.category === category);
    return found ? found.forecast_demand : 0;
  };

  // 1. Calculate dashboard-wide totals dynamically from database response
  const totalStateDemand = stateData.reduce((acc, curr) => acc + curr.total_demand, 0);
  const totalForecastDemand = stateData.reduce((acc, curr) => acc + curr.forecasted_demand, 0);
  
  // KPI: Count of states with Low Risk (Healthy States)
  const healthyStatesCount = stateData.filter(s => s.risk_level === 'Low').length;
  
  // KPI: Count of states with deficit > 0 (Deficit States)
  const deficitStatesCount = stateData.filter(s => s.deficit > 0).length;
  
  // KPI: Sum of all surplus units across all states (Surplus Inventory)
  const totalSurplusInventory = stateData.reduce((acc, curr) => acc + curr.surplus, 0);
  
  const totalRecommendedTransfers = stateData.reduce((acc, curr) => acc + curr.recommended_transfers.length, 0);

  // 2. Find max category demand for heatmap scaling
  let maxCategoryDemand = 1;
  stateData.forEach(state => {
    CATEGORIES.forEach(category => {
      const val = getCategoryDemand(state, category);
      if (val > maxCategoryDemand) maxCategoryDemand = val;
    });
  });

  // 3. Format risk level badge styles
  const getRiskBadge = (level) => {
    switch (level) {
      case 'High':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <ShieldAlert size={12} /> High Risk
          </span>
        );
      case 'Medium':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <AlertTriangle size={12} /> Medium Risk
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck size={12} /> Low Risk
          </span>
        );
    }
  };

  // Filter state cards list based on click interactions
  const filteredStates = stateData.filter(state => {
    if (filterMode === 'HEALTHY') return state.risk_level === 'Low';
    if (filterMode === 'DEFICIT') return state.deficit > 0;
    return true;
  });

  if (loading && stateData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw size={48} className="animate-spin text-primary" />
        <p className="text-muted-foreground font-semibold">Running ML pipelines and aggregating state telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
             <Brain className="text-primary animate-pulse" size={36} />
             <TypewriterText text="AI Demand Intelligence" />
          </h1>
          <p className="text-muted-foreground font-medium">State-wise predictive modeling powered by Linear Regression, Random Forest, and XGBoost.</p>
        </div>
        <button 
            onClick={handleRetrainModels}
            disabled={retraining}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={20} className={retraining ? 'animate-spin' : ''} />
          {retraining ? 'Refitting AI Engines...' : 'Retrain AI Models'}
        </button>
      </div>

      {/* Dynamic Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total State Demand</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{totalStateDemand.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-muted-foreground">units</span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Forecast Demand</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{totalForecastDemand.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-muted-foreground">units</span>
          </div>
        </div>

        {/* KPI: Healthy States (Click to Filter) */}
        <div 
          onClick={() => setFilterMode(filterMode === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
          className={`bg-card p-5 rounded-2xl border cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between ${filterMode === 'HEALTHY' ? 'border-primary ring-2 ring-primary/25 bg-primary/5 shadow-md shadow-primary/5' : 'border-border'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Healthy States</span>
            {filterMode === 'HEALTHY' && <span className="text-[8px] bg-primary text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90">Active</span>}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-success">{healthyStatesCount}</span>
            <span className="text-[10px] font-bold text-muted-foreground">states</span>
          </div>
        </div>

        {/* KPI: Surplus Inventory (Click to Open Analysis) */}
        <div 
          onClick={() => setIsSurplusModalOpen(true)}
          className="bg-card p-5 rounded-2xl border border-border cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between group hover:border-primary/60 hover:shadow-md hover:shadow-primary/5"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Surplus Inventory</span>
            <span className="text-[8px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full font-bold group-hover:bg-primary/10 group-hover:text-primary transition-all">Analyze</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-primary">{totalSurplusInventory.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-muted-foreground">units</span>
          </div>
        </div>

        {/* KPI: Deficit States (Click to Filter) */}
        <div 
          onClick={() => setFilterMode(filterMode === 'DEFICIT' ? 'ALL' : 'DEFICIT')}
          className={`bg-card p-5 rounded-2xl border cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between ${filterMode === 'DEFICIT' ? 'border-amber-500 ring-2 ring-amber-500/25 bg-amber-500/5 shadow-md shadow-amber-500/5' : 'border-border'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deficit States</span>
            {filterMode === 'DEFICIT' && <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90">Active</span>}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-500">{deficitStatesCount}</span>
            <span className="text-[10px] font-bold text-muted-foreground">states</span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Transfers</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-accent">{totalRecommendedTransfers}</span>
            <span className="text-[10px] font-bold text-muted-foreground">routes</span>
          </div>
        </div>

      </div>

      {/* State-wise Demand Intelligence Cards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black uppercase tracking-wider text-muted-foreground">
            State Demand Intelligence Cards
            {filterMode !== 'ALL' && (
              <span className="text-xs font-semibold lowercase tracking-normal text-muted-foreground/85 ml-2">
                (showing {filteredStates.length} of {stateData.length} states)
              </span>
            )}
          </h2>
          {filterMode !== 'ALL' && (
            <button 
              onClick={() => setFilterMode('ALL')}
              className="text-xs text-primary font-bold hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStates.map(state => (
            <div key={state.state_id} className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-tight text-foreground">{state.state_name}</h3>
                {getRiskBadge(state.risk_level)}
              </div>

              {/* Core Metrics */}
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-5 mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Current Demand</p>
                  <p className="text-base font-extrabold">{state.total_demand.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Forecast Demand</p>
                  <p className="text-base font-extrabold text-primary">{state.forecasted_demand.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Inventory Available</p>
                  <p className="text-base font-extrabold">{state.total_inventory.toLocaleString()}</p>
                </div>
              </div>

              {/* growth and rebalancing recommendations */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center gap-1"><Sliders size={14} /> Demand Growth Rate</span>
                  <span className={`flex items-center gap-0.5 font-bold ${state.growth_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {state.growth_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {state.growth_pct >= 0 ? '+' : ''}{state.growth_pct}%
                  </span>
                </div>

                <div className="bg-secondary/20 p-4 rounded-2xl border border-border/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2.5 flex items-center gap-1.5">
                    <Zap size={12} className="text-primary" /> AI Rebalancing Recommendations
                  </p>
                  
                  {state.recommended_transfers.length > 0 ? (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {state.recommended_transfers.map((rec) => (
                        <div key={rec.id} className="flex justify-between items-start text-xs border-b border-border/20 pb-2 last:border-b-0 last:pb-0">
                          <div>
                            <span className="font-bold text-foreground">{rec.product_name}</span>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span>From {rec.source_depot_name}</span>
                              <MoveRight size={10} />
                              <span>To {rec.destination_depot_name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 bg-success/10 text-success rounded font-extrabold text-[10px]">
                              +{rec.quantity} units
                            </span>
                            <p className="text-[9px] text-muted-foreground mt-0.5">Score: {rec.recommendation_score}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <ShieldCheck className="mx-auto text-success/40 mb-1" size={24} />
                      <p className="text-[10px] font-bold text-muted-foreground">NO TRANSFERS REQUIRED</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: State-wise Demand Forecast */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-muted-foreground mb-1">State-wise Demand Forecast</h3>
            <p className="text-xs text-muted-foreground mb-6">Historical Demand vs Machine Learning Predictions (Month 5).</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="state_name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="total_demand" stroke="hsl(var(--muted-foreground))" strokeWidth={2.5} name="Current Demand" activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="forecasted_demand" stroke="hsl(var(--primary))" strokeWidth={4} name="Forecast Demand" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: State-wise Inventory Availability */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-muted-foreground mb-1">State-wise Inventory Availability</h3>
            <p className="text-xs text-muted-foreground mb-6">Available Stock quantity currently stored in state depots.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="state_name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="total_inventory" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} name="Available Stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Surplus vs Deficit Analysis */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-muted-foreground mb-1">Surplus vs Deficit Analysis</h3>
            <p className="text-xs text-muted-foreground mb-6">Comparison of surplus inventory quantities against regional deficits.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="state_name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="surplus" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="Surplus Inventory" />
                <Bar dataKey="deficit" stackId="a" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} name="Deficit Inventory" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Demand Heatmap */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-muted-foreground mb-1">Demand Heatmap</h3>
            <p className="text-xs text-muted-foreground mb-6">Interactive demand intensity across States and Product Categories.</p>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/20 border-b border-border">
                  <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">State</th>
                  {CATEGORIES.map(cat => (
                    <th key={cat} className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground min-w-[95px]">{cat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stateData.map(state => (
                  <tr key={state.state_id} className="hover:bg-secondary/10 border-b border-border last:border-b-0">
                    <td className="p-3 font-bold text-xs border-r border-border bg-secondary/5">{state.state_name}</td>
                    {CATEGORIES.map(cat => {
                      const val = getCategoryDemand(state, cat);
                      const intensity = val / maxCategoryDemand;
                      const bgStyle = {
                        backgroundColor: `hsla(174, 84%, 26%, ${Math.max(0.02, intensity * 0.9)})`,
                        color: intensity > 0.45 ? '#fff' : 'inherit'
                      };
                      return (
                        <td key={cat} className="p-3 text-center border-r border-border last:border-r-0 relative group font-bold text-xs" style={bgStyle}>
                          {Math.round(val).toLocaleString()}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-background text-foreground text-[10px] font-black p-2 rounded-lg shadow-xl border border-border whitespace-nowrap z-30">
                            {state.state_name} ({cat}): {Math.round(val).toLocaleString()} units
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-8 rounded-3xl relative overflow-hidden">
        <Sparkles className="absolute -right-4 -top-4 w-32 h-32 opacity-5 text-primary" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Brain className="text-primary" size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-primary">AI Insights Section</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-card p-5 rounded-2xl border border-border flex items-start gap-4 shadow-sm hover:translate-y-[-2px] transition-transform">
                <div className="mt-1 p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground mb-1">Insight #{idx + 1}</p>
                  <p className="text-sm font-semibold text-foreground leading-snug">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Side Drawer / Modal: Surplus Inventory Analysis */}
      {isSurplusModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-4xl max-h-[85vh] rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/10">
              <div>
                <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <Package className="text-primary animate-pulse" size={24} /> Surplus Inventory Analysis
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">Detailed state-wise and product-wise surplus breakdown from live database records.</p>
              </div>
              <button 
                onClick={() => setIsSurplusModalOpen(false)}
                className="px-3 py-1.5 bg-secondary hover:bg-muted text-foreground hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider rounded-xl border border-border"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {stateData.map(state => (
                <div key={state.state_id} className="space-y-3">
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <h4 className="font-bold text-base text-foreground">{state.state_name}</h4>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black border border-primary/20">
                      {state.surplus.toLocaleString()} surplus units
                    </span>
                  </div>

                  {state.surplus_breakdown && state.surplus_breakdown.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-secondary/40 font-black text-muted-foreground uppercase tracking-widest text-[9px] border-b border-border/60">
                          <tr>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3 text-right">Available Inventory</th>
                            <th className="p-3 text-right">Forecast Demand</th>
                            <th className="p-3 text-right text-primary">Surplus Units</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {state.surplus_breakdown.map((item, idx) => (
                            <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                              <td className="p-3 font-semibold">{item.product_name}</td>
                              <td className="p-3 text-muted-foreground">{item.category}</td>
                              <td className="p-3 text-right">{item.inventory.toLocaleString()}</td>
                              <td className="p-3 text-right">{item.forecast.toLocaleString()}</td>
                              <td className="p-3 text-right font-black text-primary">+{item.surplus.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-1 pl-1">No surplus items detected for this state.</p>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-secondary/5 border-t border-border flex justify-end">
              <button 
                onClick={() => setIsSurplusModalOpen(false)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
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

export default Forecasting;
