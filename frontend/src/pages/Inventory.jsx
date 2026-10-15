import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, TrendingDown, TrendingUp, Package, 
  Search, Filter, Download, Plus, ArrowDownCircle, ArrowUpCircle, History,
  Activity, List, X, Loader2, Edit3, ArrowRight,
  Sliders, FileText, MessageSquare, Clock
} from 'lucide-react';
import { productsAPI, inventoryAPI } from '../services/api';
import TypewriterText from '../components/TypewriterText';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('TABLE'); // TABLE, STOCK_IN, STOCK_OUT, HISTORY
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionMode, setTransactionMode] = useState('IN'); // IN, OUT, ADJUSTMENT
  const [selectedProductForTx, setSelectedProductForTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form values state
  const [formValues, setFormValues] = useState({
    product_id: '',
    quantity: '10',
    reason: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [productsData, stats] = await Promise.all([
        productsAPI.getAll(),
        inventoryAPI.getStatus()
      ]);
      setProducts(productsData);
      setInventoryStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    try {
      setLoadingHistory(true);
      const txs = await inventoryAPI.getTransactions();
      setTransactions(txs);
      setLoadingHistory(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistoryData();
    }
  }, [activeTab]);

  useEffect(() => {
    let result = products;
    if (filterStatus === 'low') {
      result = result.filter(p => p.current_stock <= p.reorder_level && p.current_stock >= p.critical_threshold);
    } else if (filterStatus === 'critical') {
      result = result.filter(p => p.current_stock < p.critical_threshold);
    } else if (filterStatus === 'healthy') {
      result = result.filter(p => p.current_stock > p.reorder_level);
    }
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [searchTerm, filterStatus, products]);

  const getStockStatus = (product) => {
    if (product.current_stock < product.critical_threshold) {
      return { label: 'Critical', color: 'bg-destructive/10 text-destructive', badge: 'text-destructive' };
    }
    if (product.current_stock <= product.reorder_level) {
      return { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-500', badge: 'text-amber-500' };
    }
    return { label: 'Healthy', color: 'bg-success/10 text-success', badge: 'text-success' };
  };

  const handleExport = async () => {
    try {
      window.open('http://localhost:8000/api/v1/reports/inventory?format=csv', '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleOpenTransactionModal = (mode, product = null) => {
    setTransactionMode(mode);
    setSelectedProductForTx(product);
    setFormValues({
      product_id: product ? product.id.toString() : (products[0]?.id.toString() || ''),
      quantity: '10',
      reason: mode === 'IN' ? 'Restock shipment' : mode === 'OUT' ? 'Dispatch order' : 'Inventory audit adjustment'
    });
    setFormError('');
    setShowTransactionModal(true);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const prodId = parseInt(formValues.product_id);
    const qty = parseInt(formValues.quantity);

    if (!prodId || qty <= 0) {
      setFormError('Please select a valid product and positive quantity.');
      setSubmitting(false);
      return;
    }

    const selectedProduct = products.find(p => p.id === prodId);
    if (!selectedProduct) {
      setFormError('Selected product not found.');
      setSubmitting(false);
      return;
    }

    // Validation for Stock Out / Outbound
    if (transactionMode === 'OUT' && selectedProduct.current_stock < qty) {
      setFormError(`Insufficient stock. Current stock level is ${selectedProduct.current_stock} units.`);
      setSubmitting(false);
      return;
    }

    // Validation for Adjustments resulting in negative stock
    if (transactionMode === 'ADJUSTMENT' && selectedProduct.current_stock + qty < 0) {
      setFormError(`Adjustment value exceeds current stock level (${selectedProduct.current_stock} units available).`);
      setSubmitting(false);
      return;
    }

    const payload = {
      product_id: prodId,
      quantity: qty,
      transaction_type: transactionMode,
      reason: formValues.reason
    };

    try {
      await inventoryAPI.createTransaction(payload);
      setShowTransactionModal(false);
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to submit inventory transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
      <div className={`p-3 w-fit rounded-2xl bg-${color}/10 text-${color} mb-4`}>
        <Icon size={24} />
      </div>
      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-muted-foreground font-medium">Loading stock telemetry...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <TypewriterText text="Stock Control" />
          </h1>
          <p className="text-muted-foreground font-medium">Real-time enterprise inventory intelligence.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
             <button 
                onClick={() => handleOpenTransactionModal('ADJUSTMENT')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
             >
                <Plus size={20} /> Quick Adjust
             </button>
             <button 
                onClick={handleExport}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-secondary border border-border text-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-colors"
             >
                <Download size={20} /> Export Ledger
             </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} label="Total SKU" value={inventoryStats?.total_products || 0} color="primary" />
        <StatCard icon={TrendingUp} label="Total Stock" value={inventoryStats?.total_stock || 0} color="success" />
        <StatCard icon={AlertTriangle} label="Critical Stock" value={inventoryStats?.low_stock_items || 0} color="destructive" />
        <StatCard icon={Activity} label="Health Score" value="92%" color="accent" />
      </div>

      {/* Tabs */}
      <div className="bg-card p-1.5 rounded-2xl border border-border flex gap-1 w-full max-w-2xl mx-auto overflow-x-auto no-scrollbar shadow-sm">
        {[
            { id: 'TABLE', label: 'Monitor', icon: <List size={18} /> },
            { id: 'STOCK_IN', label: 'Stock In', icon: <ArrowUpCircle size={18} /> },
            { id: 'STOCK_OUT', label: 'Stock Out', icon: <ArrowDownCircle size={18} /> },
            { id: 'HISTORY', label: 'Movement', icon: <History size={18} /> },
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/10 translate-y-[-1px]' : 'text-muted-foreground hover:bg-secondary'}`}
            >
                {tab.icon}
                {tab.label}
            </button>
        ))}
      </div>

      {/* MONITOR TAB */}
      {activeTab === 'TABLE' && (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search product name, category, SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 focus:scale-[1.01] outline-none transition-all duration-300"
                    />
                </div>
                <div className="flex bg-secondary/50 border border-border p-1 rounded-2xl">
                     {['all', 'healthy', 'low', 'critical'].map(status => (
                          <button 
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-background shadow-sm text-primary font-bold' : 'text-muted-foreground'}`}
                          >
                            {status}
                          </button>
                     ))}
                </div>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/30 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <Package size={12} className="text-primary" /> Product Intelligence
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <Activity size={12} className="text-accent" /> Shelf Life Status
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-success" /> Current Stock
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <AlertTriangle size={12} className="text-warning" /> Thresholds
                                  </div>
                                </th>
                                <th className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Sliders size={12} className="text-muted-foreground" /> Action
                                  </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredProducts.map(p => {
                                const status = getStockStatus(p);
                                const maxCapacity = Math.max(50, p.reorder_level * 3);
                                const pct = Math.min(100, Math.round((p.current_stock / maxCapacity) * 100));
                                return (
                                    <tr key={p.id} className="hover:bg-secondary/10 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                                                    <Package className="text-muted-foreground" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm">
                                            <div className="flex flex-col gap-1 w-36">
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className={status.badge}>{status.label}</span>
                                                    <span>{pct}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div 
                                                      className={`h-full ${status.badge === 'text-success' ? 'bg-success' : status.badge === 'text-amber-500' ? 'bg-warning' : 'bg-destructive'} transition-all`} 
                                                      style={{width: `${pct}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-black">{p.current_stock} <span className="text-muted-foreground text-[10px] ml-0.5">UNITS</span></td>
                                        <td className="px-6 py-5 text-xs font-bold text-muted-foreground">CRITICAL: {p.critical_threshold} • MIN: {p.reorder_level}</td>
                                        <td className="px-6 py-5 text-right">
                                            <button 
                                              onClick={() => handleOpenTransactionModal('ADJUSTMENT', p)}
                                              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                            >
                                              Manage SKU
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                              <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                  No items matching filters found.
                                </td>
                              </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* INBOUND SHIPMENTS TAB */}
      {activeTab === 'STOCK_IN' && (
          <div className="bg-card p-10 rounded-3xl border border-border text-center max-w-2xl mx-auto shadow-sm">
              <ArrowUpCircle size={48} className="mx-auto text-success mb-4" />
              <h3 className="text-xl font-bold">Inbound Inventory Processor</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2 leading-relaxed">Log manufacturer deliveries, vendor shipments, and incoming stock arrivals into the central warehouse database.</p>
              <button 
                onClick={() => handleOpenTransactionModal('IN')}
                className="mt-8 px-8 py-3 bg-success text-white rounded-2xl font-bold shadow-lg shadow-success/20 hover:scale-105 active:scale-95 transition-transform"
              >
                Launch Inbound Wizard
              </button>
          </div>
      )}

      {/* OUTBOUND DISPATCH TAB */}
      {activeTab === 'STOCK_OUT' && (
          <div className="bg-card p-10 rounded-3xl border border-border text-center max-w-2xl mx-auto shadow-sm">
              <ArrowDownCircle size={48} className="mx-auto text-destructive mb-4" />
              <h3 className="text-xl font-bold">Outbound Order Dispatch</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2 leading-relaxed">Fulfill logistics shipments, retail dispatches, and log outbound movements with automated inventory deduction checks.</p>
              <button 
                onClick={() => handleOpenTransactionModal('OUT')}
                className="mt-8 px-8 py-3 bg-destructive text-white rounded-2xl font-bold shadow-lg shadow-destructive/20 hover:scale-105 active:scale-95 transition-transform"
              >
                Launch Outbound Wizard
              </button>
          </div>
      )}

      {/* MASTER LEDGER HISTORY TAB */}
      {activeTab === 'HISTORY' && (
          <div className="space-y-6">
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/15">
                  <h3 className="text-lg font-bold">Movement Intelligence History</h3>
                  <button 
                    onClick={fetchHistoryData}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Refresh Logs
                  </button>
              </div>

              {loadingHistory ? (
                <div className="py-20 flex justify-center items-center gap-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-sm font-medium text-muted-foreground">Loading ledger...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/20 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <FileText size={12} className="text-primary" /> Transaction ID
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <Package size={12} className="text-accent" /> Product Name
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <ArrowRight size={12} className="text-success" /> Movement Type
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-primary" /> Quantity
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <MessageSquare size={12} className="text-accent" /> Reason / Remarks
                                  </div>
                                </th>
                                <th className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-success" /> Timestamp
                                  </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {transactions.map(t => {
                                const product = products.find(p => p.id === t.product_id);
                                return (
                                    <tr key={t.id} className="hover:bg-secondary/10 transition-colors text-sm">
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-muted-foreground">#TX-{String(t.id).padStart(4, '0')}</td>
                                        <td className="px-6 py-4 font-bold">{product ? product.name : `SKU #${t.product_id}`}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase border ${t.transaction_type === 'IN' ? 'bg-success/15 text-success border-success/20' : t.transaction_type === 'OUT' ? 'bg-destructive/15 text-destructive border-destructive/20' : 'bg-accent/15 text-accent border-accent/20'}`}>
                                                {t.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-black">{t.quantity} UNITS</td>
                                        <td className="px-6 py-4 text-muted-foreground font-medium italic">"{t.reason || 'No remarks provided.'}"</td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                                            {new Date(t.timestamp).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                );
                            })}
                            {transactions.length === 0 && (
                              <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                                  No transaction history found.
                                </td>
                              </tr>
                            )}
                        </tbody>
                    </table>
                </div>
              )}
            </div>
          </div>
      )}

      {/* Transaction Modal (IN, OUT, ADJUSTMENT) */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowTransactionModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
              {transactionMode === 'IN' ? <ArrowUpCircle className="text-success" size={24} /> : transactionMode === 'OUT' ? <ArrowDownCircle className="text-destructive" size={24} /> : <Edit3 className="text-accent" size={24} />}
              {transactionMode === 'IN' ? 'Log Inbound Delivery' : transactionMode === 'OUT' ? 'Log Outbound Dispatch' : 'Log Stock Adjustment'}
            </h2>
            
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Select Target Product *</label>
                {selectedProductForTx ? (
                  <div className="p-3 bg-secondary rounded-xl font-bold text-sm text-foreground">
                    {selectedProductForTx.name} (Current: {selectedProductForTx.current_stock} units)
                  </div>
                ) : (
                  <select 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                    value={formValues.product_id}
                    onChange={(e) => setFormValues({...formValues, product_id: e.target.value})}
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.current_stock} pcs in stock)</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  {transactionMode === 'ADJUSTMENT' ? 'Adjustment Offset (use negative for deduction) *' : 'Quantity (Units) *'}
                </label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formValues.quantity}
                  onChange={(e) => setFormValues({...formValues, quantity: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Remarks / Transaction Reason *</label>
                <textarea 
                  rows="3"
                  required
                  placeholder={transactionMode === 'IN' ? 'e.g. Shipment arrival order reference #492' : 'e.g. Dispatched for North Chennai outlet delivery'}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none resize-none"
                  value={formValues.reason}
                  onChange={(e) => setFormValues({...formValues, reason: e.target.value})}
                />
              </div>

              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 py-2.5 bg-secondary text-foreground font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md ${transactionMode === 'IN' ? 'bg-success hover:bg-success/90 shadow-success/10' : transactionMode === 'OUT' ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/10' : 'bg-primary hover:bg-primary/90 shadow-primary/10'}`}
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  Submit Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
