import React, { useState, useEffect } from 'react';
import { rebalancingAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, Plus, Search, Trash2, Edit, Loader2, Boxes, Warehouse, 
  Compass, ShieldAlert, Save, X, Edit2, LayoutGrid, List as ListIcon, Filter
} from 'lucide-react';
import TypewriterText from '../components/TypewriterText';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const Depots = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [depots, setDepots] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Add Depot Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [stateId, setStateId] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('10000');
  const [latitude, setLatitude] = useState('13.0827');
  const [longitude, setLongitude] = useState('80.2707');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Stock Management Modal
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  const [editReorderValue, setEditReorderValue] = useState('');
  const [editCriticalValue, setEditCriticalValue] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const depotsData = await rebalancingAPI.getDepots();
      setDepots(depotsData);
      const statesData = await rebalancingAPI.getStates();
      setStates(statesData);
      if (statesData.length > 0) {
        setStateId(statesData[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddDepot = async (e) => {
    e.preventDefault();
    if (isAdmin) return; // double check RBAC
    if (!name.trim() || !stateId) {
      setFormError('Depot name and state are required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await rebalancingAPI.createDepot({
        name,
        state_id: parseInt(stateId),
        address,
        capacity: parseInt(capacity) || 10000,
        latitude: parseFloat(latitude) || 0.0,
        longitude: parseFloat(longitude) || 0.0
      });
      setName('');
      setAddress('');
      setShowAddModal(false);
      // Refresh list
      const depotsData = await rebalancingAPI.getDepots();
      setDepots(depotsData);
    } catch (err) {
      setFormError(err.message || 'Failed to create depot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepot = async (id) => {
    if (isAdmin) return; // RBAC Check
    if (!window.confirm('Deleting a depot will also clear its associated inventory records. Proceed?')) return;
    try {
      await rebalancingAPI.deleteDepot(id);
      const data = await rebalancingAPI.getDepots();
      setDepots(data);
    } catch (err) {
      alert(err.message || 'Failed to delete depot');
    }
  };

  // Inventory Management
  const handleOpenStockManagement = async (depot) => {
    setSelectedDepot(depot);
    setLoadingInventory(true);
    try {
      const data = await rebalancingAPI.getDepotInventory(depot.id);
      setInventoryList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleStartEditItem = (item) => {
    if (isAdmin) return;
    setEditingItemId(item.id);
    setEditStockValue(String(item.current_stock));
    setEditReorderValue(String(item.reorder_level));
    setEditCriticalValue(String(item.critical_threshold));
  };

  const handleSaveStockItem = async (item) => {
    if (isAdmin) return;
    try {
      await rebalancingAPI.updateDepotInventory(item.depot_id, item.product_id, {
        current_stock: parseInt(editStockValue),
        reorder_level: parseInt(editReorderValue),
        critical_threshold: parseInt(editCriticalValue)
      });
      setEditingItemId(null);
      const data = await rebalancingAPI.getDepotInventory(item.depot_id);
      setInventoryList(data);
    } catch (err) {
      alert(err.message || 'Failed to update stock');
    }
  };

  const filteredDepots = depots.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.address && d.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesState = !stateFilter || String(d.state_id) === stateFilter;
    return matchesSearch && matchesState;
  });

  // Capacity chart data mapping
  const chartData = depots.map(d => ({
    name: d.name,
    Capacity: d.capacity
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="Depots & Hubs" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage warehouse facilities, capacities, coordinates, and physical stock holdings.</p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => { setShowAddModal(true); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-bold transition-all hover:scale-[1.02] shadow-md shadow-accent/10"
          >
            <Plus size={16} /> Add Supply Depot
          </button>
        )}
      </div>

      {/* Recharts Analytics Panel */}
      {depots.length > 0 && (
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">Supply Network Capacity Distribution</h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(30, 30, 30, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#fff' }}
                  itemStyle={{ fontSize: '11px', color: '#10b981' }}
                />
                <Bar dataKey="Capacity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search depots, states, addresses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full sm:w-auto items-center gap-2.5 justify-end">
          <div className="relative">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="appearance-none bg-secondary/50 border border-border/40 text-foreground py-2.5 pl-3 pr-8 text-xs font-bold rounded-xl focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All States</option>
              {states.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
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

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-muted-foreground font-medium">Loading network depots...</div>
        </div>
      ) : filteredDepots.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border text-center">
          <Warehouse size={48} className="mx-auto text-muted-foreground/15 mb-2" />
          <p className="text-sm font-bold text-muted-foreground">No network depots found.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table Mode */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Warehouse size={12} className="text-primary" /> Depot ID
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-accent" /> Depot Name
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Boxes size={12} className="text-primary" /> State
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Compass size={12} className="text-accent" /> Capacity & Coordinates
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDepots.map(depot => (
                  <tr key={depot.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-foreground">DEP-{String(depot.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-sm text-foreground">{depot.name}</div>
                        <span className="text-[10px] text-muted-foreground font-medium">{depot.address || 'No Address Specified'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase">{depot.state_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <div className="font-bold text-foreground">{depot.capacity.toLocaleString()} units capacity</div>
                        <span className="text-[10px] text-muted-foreground font-mono">LAT: {depot.latitude.toFixed(4)} • LON: {depot.longitude.toFixed(4)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleOpenStockManagement(depot)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors"
                        >
                          {isAdmin ? 'View Stock' : 'Manage Stock'}
                        </button>
                        {!isAdmin && (
                          <button 
                            onClick={() => handleDeleteDepot(depot.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Delete Depot"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepots.map(depot => (
            <div 
              key={depot.id}
              className="bg-card p-6 rounded-3xl border border-border flex flex-col justify-between gap-5 transition-all hover:shadow-lg hover:border-primary/20"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">DEP-{String(depot.id).padStart(3, '0')}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-foreground border border-border/40">
                    {depot.state_name}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-foreground">{depot.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px] line-clamp-2">
                    {depot.address || 'No Address Specified'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left pt-3 border-t border-border/40">
                  <div className="bg-secondary/35 p-2.5 rounded-xl border border-border/40">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Capacity</p>
                    <span className="text-xs font-bold text-foreground">{depot.capacity.toLocaleString()} units</span>
                  </div>
                  <div className="bg-secondary/35 p-2.5 rounded-xl border border-border/40">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Coordinates</p>
                    <span className="text-[9px] font-mono text-foreground font-semibold">
                      {depot.latitude.toFixed(2)}, {depot.longitude.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-border/40 pt-4">
                <button
                  onClick={() => handleOpenStockManagement(depot)}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all"
                >
                  {isAdmin ? 'View Depot Stock' : 'Manage Depot Stock'}
                </button>
                {!isAdmin && (
                  <button
                    onClick={() => handleDeleteDepot(depot.id)}
                    className="p-2 border border-border/60 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Depot Modal */}
      {showAddModal && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Warehouse className="text-primary" /> Add New Depot
            </h3>
            
            <form onSubmit={handleAddDepot} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Depot Name *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chennai Depot"
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Territory State *</label>
                  <select 
                    value={stateId}
                    onChange={(e) => setStateId(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    required
                  >
                    {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Industrial Area Phase II"
                  className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Capacity (Units)</label>
                  <input 
                    type="number" 
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Latitude</label>
                  <input 
                    type="text" 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Longitude</label>
                  <input 
                    type="text" 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
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
                  {submitting && <Loader2 className="animate-spin" size={12} />} Save Depot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Management panel / modal */}
      {selectedDepot && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card h-full w-full max-w-2xl border-l border-border p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-b-border/50">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Local Depot Inventory</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedDepot.name} • {selectedDepot.state_name}</p>
                </div>
                <button 
                  onClick={() => setSelectedDepot(null)}
                  className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingInventory ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <div className="text-muted-foreground text-xs font-semibold">Fetching local inventory metrics...</div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-4">
                  {inventoryList.map(item => (
                    <div key={item.id} className="p-4 bg-secondary/20 border border-border/60 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.product_name}</p>
                          <span className="text-[9px] text-muted-foreground font-mono">PRODUCT ID: {item.product_id}</span>
                        </div>
                        {!isAdmin && (
                          editingItemId !== item.id ? (
                            <button 
                              onClick={() => handleStartEditItem(item)}
                              className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-all"
                            >
                              <Edit2 size={12} />
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleSaveStockItem(item)}
                                className="p-1 hover:bg-success/20 text-success rounded transition-all"
                                title="Save Changes"
                              >
                                <Save size={12} />
                              </button>
                              <button 
                                onClick={() => setEditingItemId(null)}
                                className="p-1 hover:bg-destructive/20 text-destructive rounded transition-all"
                                title="Discard Changes"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )
                        )}
                      </div>

                      {editingItemId !== item.id ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-background/40 p-2.5 rounded-xl border border-border/30 text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Current Stock</p>
                            <p className="text-lg font-black text-foreground mt-0.5">{item.current_stock}</p>
                          </div>
                          <div className="bg-background/40 p-2.5 rounded-xl border border-border/30 text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Reorder Level</p>
                            <p className="text-lg font-black text-accent mt-0.5">{item.reorder_level}</p>
                          </div>
                          <div className="bg-background/40 p-2.5 rounded-xl border border-border/30 text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Critical Level</p>
                            <p className="text-lg font-black text-destructive mt-0.5">{item.critical_threshold}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[9px] font-black text-muted-foreground uppercase mb-1">Current Stock</label>
                            <input 
                              type="number"
                              value={editStockValue}
                              onChange={(e) => setEditStockValue(e.target.value)}
                              className="w-full bg-background border border-border text-foreground font-bold rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-muted-foreground uppercase mb-1">Reorder Level</label>
                            <input 
                              type="number"
                              value={editReorderValue}
                              onChange={(e) => setEditReorderValue(e.target.value)}
                              className="w-full bg-background border border-border text-foreground font-bold rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-muted-foreground uppercase mb-1">Critical Level</label>
                            <input 
                              type="number"
                              value={editCriticalValue}
                              onChange={(e) => setEditCriticalValue(e.target.value)}
                              className="w-full bg-background border border-border text-foreground font-bold rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {inventoryList.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground text-sm font-semibold">
                      No products assigned to this depot.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <button 
                onClick={() => setSelectedDepot(null)}
                className="px-6 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 text-xs font-bold rounded-xl transition-all"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depots;
