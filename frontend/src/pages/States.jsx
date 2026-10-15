import React, { useState, useEffect } from 'react';
import { rebalancingAPI } from '../services/api';
import { Boxes, Plus, Search, Trash2, Map, Globe, Loader2, ArrowLeft } from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const States = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('South');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const data = await rebalancingAPI.getStates();
      setStates(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddState = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('State name is required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await rebalancingAPI.createState({ name, region });
      setName('');
      setShowAddModal(false);
      fetchStates();
    } catch (err) {
      setFormError(err.message || 'Failed to create state');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteState = async (id) => {
    if (!window.confirm('Are you sure you want to delete this state?')) return;
    try {
      await rebalancingAPI.deleteState(id);
      fetchStates();
    } catch (err) {
      alert(err.message || 'Failed to delete state');
    }
  };

  const filteredStates = states.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.region && s.region.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="States & Regions" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage geographic boundaries and operational territories.</p>
        </div>
        <button 
          onClick={() => { setShowAddModal(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-bold transition-all hover:scale-[1.02] shadow-md shadow-accent/10"
        >
          <Plus size={16} /> Add Territory State
        </button>
      </div>

      <div className="relative max-w-md group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search state name or region..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-full py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 focus:scale-[1.01] outline-none transition-all duration-300"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-muted-foreground font-medium">Loading operational states...</div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Boxes size={12} className="text-primary" /> State ID
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Map size={12} className="text-accent" /> State Name
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Globe size={12} className="text-primary" /> Region
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStates.map(state => (
                  <tr key={state.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-foreground">ST-{String(state.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4 font-bold text-sm text-foreground">{state.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">{state.region || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleDeleteState(state.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          title="Delete State"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStates.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <Boxes size={48} className="mx-auto text-muted-foreground/15 mb-2" />
                      <p className="text-sm font-bold text-muted-foreground">No territory states found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add State Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Boxes className="text-primary" /> Add New State
            </h3>
            
            <form onSubmit={handleAddState} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">State Name *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tamil Nadu, Karnataka"
                  className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Region</label>
                <select 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                >
                  <option value="South">South</option>
                  <option value="North">North</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                </select>
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
                  {submitting && <Loader2 className="animate-spin" size={12} />} Save State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default States;
