import React, { useState, useEffect } from 'react';
import { rebalancingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Route as RouteIcon, Plus, Search, Trash2, Loader2, Warehouse, Compass, IndianRupee, Clock, ArrowRight, Grid, LayoutGrid, List as ListIcon
} from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const DistanceMatrix = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [distances, setDistances] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('matrix'); // table, grid, matrix
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [distanceKm, setDistanceKm] = useState('200');
  const [transportCost, setTransportCost] = useState('2900');
  const [transitTime, setTransitTime] = useState('4.0');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const distData = await rebalancingAPI.getDistances();
      setDistances(distData);
      const depotsData = await rebalancingAPI.getDepots();
      setDepots(depotsData);
      if (depotsData.length > 1) {
        setSourceId(depotsData[0].id);
        setDestinationId(depotsData[1].id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDistanceChange = (val) => {
    setDistanceKm(val);
    const dist = parseFloat(val) || 0.0;
    const estCost = (dist * 12.0) + 500.0;
    const estTime = dist / 50.0;
    setTransportCost(String(roundValue(estCost)));
    setTransitTime(String(roundValue(estTime)));
  };

  const roundValue = (val) => Math.round(val * 10) / 10;

  const handleAddDistance = async (e) => {
    e.preventDefault();
    if (!sourceId || !destinationId) {
      setFormError('Please select both source and destination depots.');
      return;
    }
    if (sourceId === destinationId) {
      setFormError('Source and destination depots must be different.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await rebalancingAPI.createDistance({
        source_depot_id: parseInt(sourceId),
        destination_depot_id: parseInt(destinationId),
        distance_km: parseFloat(distanceKm),
        estimated_transport_cost: parseFloat(transportCost),
        estimated_transit_time: parseFloat(transitTime)
      });
      setShowAddModal(false);
      const distData = await rebalancingAPI.getDistances();
      setDistances(distData);
    } catch (err) {
      setFormError(err.message || 'Failed to update distance matrix entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Hashing lookups for the Matrix View
  const getMatrixCell = (sourceId, destId) => {
    if (sourceId === destId) {
      return { self: true };
    }
    const match = distances.find(
      d => d.source_depot_id === sourceId && d.destination_depot_id === destId
    );
    return match || null;
  };

  const filteredDistances = distances.filter(d => 
    d.source_depot_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.destination_depot_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="Inter-Depot Distance Matrix" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Configure logistics coordinates, transit distances, transportation tariffs, and lead times between hubs.</p>
        </div>
        <button 
          onClick={() => { setShowAddModal(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-bold transition-all hover:scale-[1.02] shadow-md shadow-accent/10"
        >
          <Plus size={16} /> Configure Route Pair
        </button>
      </div>

      {/* Control panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search routing hubs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'matrix' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
            title="Matrix View"
          >
            <Grid size={14} /> Matrix
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
            title="Table View"
          >
            <ListIcon size={14} /> Table
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
            title="Card View"
          >
            <LayoutGrid size={14} /> Cards
          </button>
        </div>

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-muted-foreground font-medium">Loading logistics matrix...</div>
        </div>
      ) : distances.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border text-center">
          <RouteIcon size={48} className="mx-auto text-muted-foreground/15 mb-2" />
          <p className="text-sm font-bold text-muted-foreground">No route distance records configured.</p>
        </div>
      ) : viewMode === 'matrix' ? (
        
        /* 1. Double Entry Matrix View */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[10px] uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 text-left font-black text-muted-foreground min-w-[150px]">From \ To</th>
                  {depots.map(colDepot => (
                    <th key={colDepot.id} className="px-4 py-4 font-bold text-foreground min-w-[140px]">
                      {colDepot.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {depots.map(rowDepot => (
                  <tr key={rowDepot.id} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-6 py-4 text-left font-extrabold text-xs text-foreground bg-secondary/10 border-r border-border/40">
                      {rowDepot.name}
                    </td>
                    {depots.map(colDepot => {
                      const cell = getMatrixCell(rowDepot.id, colDepot.id);
                      if (cell?.self) {
                        return (
                          <td key={colDepot.id} className="px-4 py-4 text-[10px] text-muted-foreground italic bg-secondary/15 font-semibold">
                            Self (0 km)
                          </td>
                        );
                      }
                      if (!cell) {
                        return (
                          <td key={colDepot.id} className="px-4 py-4 text-[10px] text-destructive/70 bg-destructive/[0.02] font-semibold">
                            Unconfigured
                          </td>
                        );
                      }
                      return (
                        <td key={colDepot.id} className="px-4 py-4 text-xs font-medium">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-foreground">{cell.distance_km.toFixed(0)} km</span>
                            <span className="text-[10px] text-muted-foreground">₹{cell.estimated_transport_cost.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] text-accent font-semibold">{cell.estimated_transit_time.toFixed(1)} hrs</span>
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
      ) : viewMode === 'table' ? (
        
        /* 2. Table List View */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Warehouse size={12} className="text-primary" /> Source Depot
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight size={12} className="text-accent" /> Destination Depot
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <RouteIcon size={12} className="text-primary" /> Distance
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee size={12} className="text-accent" /> Est. Cost
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-primary" /> Lead Time
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDistances.map(dist => (
                  <tr key={dist.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-xs text-foreground">{dist.source_depot_name}</td>
                    <td className="px-6 py-4 font-bold text-xs text-foreground">{dist.destination_depot_name}</td>
                    <td className="px-6 py-4 font-bold text-xs text-foreground">{dist.distance_km.toFixed(1)} KM</td>
                    <td className="px-6 py-4 font-bold text-xs text-foreground">₹{dist.estimated_transport_cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">{dist.estimated_transit_time.toFixed(1)} Hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* 3. Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDistances.map(dist => (
            <div 
              key={dist.id}
              className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between gap-4 transition-all hover:shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-bold">Route Code: R-{String(dist.id).padStart(3, '0')}</span>
                  <span className="font-semibold text-accent">{dist.estimated_transit_time.toFixed(1)} hrs transit</span>
                </div>
                
                <div className="flex items-center justify-between bg-secondary/35 p-3 rounded-xl border border-border/30">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">From</p>
                    <span className="text-xs font-extrabold text-foreground">{dist.source_depot_name}</span>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground mx-2" />
                  <div className="text-right">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">To</p>
                    <span className="text-xs font-extrabold text-foreground">{dist.destination_depot_name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-left">
                  <div className="bg-secondary/20 p-2.5 rounded-xl border border-border/30">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Distance</p>
                    <span className="text-xs font-bold text-foreground">{dist.distance_km.toFixed(1)} KM</span>
                  </div>
                  <div className="bg-secondary/20 p-2.5 rounded-xl border border-border/30">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Transport Tariff</p>
                    <span className="text-xs font-bold text-foreground">₹{dist.estimated_transport_cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Update Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <RouteIcon className="text-primary" /> Configure Route Pair Details
            </h3>
            
            <form onSubmit={handleAddDistance} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Source Depot *</label>
                  <select 
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    required
                  >
                    {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Destination Depot *</label>
                  <select 
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    required
                  >
                    {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Distance (KM) *</label>
                  <input 
                    type="number" 
                    value={distanceKm}
                    onChange={(e) => handleDistanceChange(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Transport Cost (₹) *</label>
                  <input 
                    type="number" 
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Transit Time (Hrs) *</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={transitTime}
                    onChange={(e) => setTransitTime(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-destructive font-semibold">{formError}</p>}

              <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={12} />} Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DistanceMatrix;
