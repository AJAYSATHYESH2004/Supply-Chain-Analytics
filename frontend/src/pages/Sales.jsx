import React, { useState, useEffect } from 'react';
import {
  TrendingUp, IndianRupee, ShoppingCart, Calendar,
  Search, Filter, Download, Plus, X, Loader2,
  FileText, Package, Coins
} from 'lucide-react';
import { salesAPI, productsAPI } from '../services/api';
import TypewriterText from '../components/TypewriterText';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState({});
  const [productsList, setProductsList] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [salesStats, setSalesStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formValues, setFormValues] = useState({
    product_id: '',
    quantity: '1',
    unit_price: '0.00',
    total_amount: '0.00'
  });

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Fetch all sales
      const salesData = await salesAPI.getAll();
      setSales(salesData);
      
      // Fetch products
      const productsData = await productsAPI.getAll();
      setProductsList(productsData);
      const productMap = {};
      productsData.forEach(p => {
        productMap[p.id] = p;
      });
      setProducts(productMap);
      
      // Fetch stats
      const stats = await salesAPI.getStats();
      setSalesStats(stats);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setLoading(false);
    }
  };

  // Filter and search sales
  useEffect(() => {
    let result = sales;
    if (searchTerm) {
      result = result.filter(sale => {
        const product = products[sale.product_id];
        return product && product.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    setFilteredSales(result);
  }, [searchTerm, sales, products]);

  // Recalculate price on quantity/product changes
  useEffect(() => {
    if (formValues.product_id) {
      const product = products[formValues.product_id];
      if (product) {
        const qty = parseInt(formValues.quantity) || 0;
        const price = product.price;
        setFormValues(prev => ({
          ...prev,
          unit_price: price.toFixed(2),
          total_amount: (qty * price).toFixed(2)
        }));
      }
    }
  }, [formValues.product_id, formValues.quantity, products]);

  const handleOpenAddModal = () => {
    setFormValues({
      product_id: productsList[0]?.id || '',
      quantity: '1',
      unit_price: '0.00',
      total_amount: '0.00'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
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

    const selectedProduct = products[prodId];
    if (selectedProduct && selectedProduct.current_stock < qty) {
      setFormError(`Insufficient stock. Current stock is ${selectedProduct.current_stock} units.`);
      setSubmitting(false);
      return;
    }

    const payload = {
      product_id: prodId,
      quantity: qty,
      unit_price: parseFloat(formValues.unit_price),
      total_amount: parseFloat(formValues.total_amount),
      sale_date: new Date().toISOString()
    };

    try {
      await salesAPI.create(payload);
      setShowModal(false);
      fetchSalesData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to submit sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-accent/10 rounded-xl">
          <Icon className="text-accent" size={20} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-muted-foreground font-medium">Loading sales ledger...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <TypewriterText text="Sales Management" />
          </h1>
          <p className="text-muted-foreground mt-1">Track customer orders, log invoices, and review profit metrics.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Sale
        </button>
      </div>

      {/* Stats Grid */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={ShoppingCart} label="Total Orders" value={salesStats.total_orders} />
          <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${salesStats.total_sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} />
          <StatCard icon={TrendingUp} label="Avg Order Value" value={`₹${salesStats.average_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 focus:scale-[1.01] outline-none transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-lg">Recent Sales Ledger</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-primary" /> Invoice ID
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Package size={12} className="text-accent" /> Product
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-success" /> Quantity
                  </div>
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center gap-1.5">
                    <IndianRupee size={12} className="text-primary" /> Unit Price
                  </div>
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center gap-1.5">
                    <Coins size={12} className="text-accent" /> Total Amount
                  </div>
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-success" /> Sale Date
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const product = products[sale.product_id];
                  return (
                    <tr key={sale.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 text-xs font-black">#INV-{String(sale.id).padStart(4, '0')}</td>
                      <td className="px-6 py-4 font-bold text-sm">{product ? product.name : 'Unknown Product'}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{sale.quantity} UNITS</td>
                      <td className="px-6 py-4 text-sm">₹{sale.unit_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-accent">₹{sale.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(sale.sale_date).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    No sales found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShoppingCart className="text-accent" size={22} />
              Register Customer Sale
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Select Product *</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formValues.product_id}
                  onChange={(e) => setFormValues({...formValues, product_id: e.target.value})}
                  required
                >
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.current_stock} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Quantity to Sell *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                    value={formValues.quantity}
                    onChange={(e) => setFormValues({...formValues, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Unit Price (₹)</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none text-muted-foreground font-bold"
                    value={`₹${formValues.unit_price}`}
                  />
                </div>
              </div>

              <div className="p-4 bg-secondary/35 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Amount:</span>
                <span className="text-lg font-black text-accent">₹{parseFloat(formValues.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-secondary text-foreground font-bold rounded-xl text-sm hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-accent text-accent-foreground font-bold rounded-xl text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  Register Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
