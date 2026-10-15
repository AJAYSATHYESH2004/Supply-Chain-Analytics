import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Filter, 
  MoreHorizontal, Edit, Trash2, Box,
  ArrowUpDown, X, Loader2, RefreshCw,
  Tag, Coins, BarChart3, Truck, Activity, Sliders
} from 'lucide-react';
import { productsAPI, suppliersAPI } from '../services/api';
import TypewriterText from '../components/TypewriterText';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersMap, setSuppliersMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Search & Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  
  // Form values state
  const [formValues, setFormValues] = useState({
    name: '',
    category: '',
    price: '',
    current_stock: '',
    reorder_level: '10',
    critical_threshold: '5',
    supplier_id: '',
    image_url: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prods, sups] = await Promise.all([
        productsAPI.getAll(),
        suppliersAPI.getAll()
      ]);
      setProducts(prods);
      setSuppliers(sups);
      
      const map = {};
      sups.forEach(s => {
        map[s.id] = s.name;
      });
      setSuppliersMap(map);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch products/suppliers", err);
      setLoading(false);
    }
  };

  const getStockStatus = (product) => {
    if (product.current_stock < product.critical_threshold) {
      return 'Critical';
    }
    if (product.current_stock <= product.reorder_level) {
      return 'Low Stock';
    }
    return 'Healthy';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Healthy': return 'bg-success/10 text-success border-success/20';
      case 'Low Stock': return 'bg-warning/10 text-warning border-warning/20';
      case 'Critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  // CRUD Operations Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormValues({
      name: '',
      category: '',
      price: '',
      current_stock: '',
      reorder_level: '10',
      critical_threshold: '5',
      supplier_id: suppliers[0]?.id || '',
      image_url: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormValues({
      name: product.name,
      category: product.category || '',
      price: product.price.toString(),
      current_stock: product.current_stock.toString(),
      reorder_level: product.reorder_level.toString(),
      critical_threshold: product.critical_threshold.toString(),
      supplier_id: product.supplier_id || '',
      image_url: product.image_url || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenDeleteConfirm = (product) => {
    setDeletingProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    
    // Validations
    if (!formValues.name || !formValues.price || !formValues.current_stock || !formValues.supplier_id) {
      setFormError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: formValues.name,
      category: formValues.category,
      price: parseFloat(formValues.price),
      current_stock: parseInt(formValues.current_stock),
      reorder_level: parseInt(formValues.reorder_level),
      critical_threshold: parseInt(formValues.critical_threshold),
      supplier_id: parseInt(formValues.supplier_id),
      image_url: formValues.image_url || null,
      department_id: 1 // Default to Department ID 1
    };

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
      } else {
        await productsAPI.create(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    try {
      await productsAPI.delete(deletingProduct.id);
      setShowDeleteConfirm(false);
      setDeletingProduct(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Sort Logic
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const status = getStockStatus(p);
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'critical' && status === 'Critical') ||
        (selectedStatus === 'low' && status === 'Low Stock') ||
        (selectedStatus === 'healthy' && status === 'Healthy');
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.current_stock - b.current_stock;
      if (sortBy === 'stock_desc') return b.current_stock - a.current_stock;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-muted-foreground font-medium">Loading products catalog...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <TypewriterText text="Product Catalog" />
          </h1>
          <p className="text-muted-foreground mt-1">Manage your inventory products, price parameters, and suppliers.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-5 border-b border-border flex flex-col xl:flex-row gap-4 justify-between bg-secondary/10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 focus:scale-[1.01] outline-none transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Category:</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-bold bg-transparent outline-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Stock:</span>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs font-bold bg-transparent outline-none cursor-pointer"
              >
                <option value="all">ALL STATUS</option>
                <option value="healthy">HEALTHY</option>
                <option value="low">LOW STOCK</option>
                <option value="critical">CRITICAL</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold bg-transparent outline-none cursor-pointer"
              >
                <option value="name_asc">NAME (A-Z)</option>
                <option value="name_desc">NAME (Z-A)</option>
                <option value="price_asc">PRICE (LOW-HIGH)</option>
                <option value="price_desc">PRICE (HIGH-LOW)</option>
                <option value="stock_asc">STOCK (LOW-HIGH)</option>
                <option value="stock_desc">STOCK (HIGH-LOW)</option>
              </select>
            </div>
            
            <button 
              onClick={fetchData}
              className="p-2.5 bg-background border border-border rounded-xl hover:bg-secondary/50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Package size={12} className="text-primary" /> Product
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-accent" /> Category
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Coins size={12} className="text-success" /> Price
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-primary" /> Stock Level
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Truck size={12} className="text-accent" /> Supplier Partner
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} className="text-success" /> Status
                  </div>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sliders size={12} className="text-muted-foreground" /> Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-secondary/30 rounded-xl group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                          <Box size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">SKU: PRD-{String(product.id).padStart(3, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">{product.category || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-sm">₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-black">{product.current_stock}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Min: {product.reorder_level} • Crit: {product.critical_threshold}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-foreground">{suppliersMap[product.supplier_id] || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase border ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(product)}
                          className="p-2 hover:bg-accent/10 hover:text-accent rounded-xl transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteConfirm(product)}
                          className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/10 text-xs text-muted-foreground">
          <p>Showing {filteredProducts.length} of {products.length} products</p>
        </div>
      </div>

      {/* Add / Edit Modal Drawer */}
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
              <Package className="text-accent" size={22} />
              {editingProduct ? 'Edit Product Parameters' : 'Add New Catalog Product'}
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Product Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Intel Core i7 Processor"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  value={formValues.name}
                  onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Processors"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                    value={formValues.category}
                    onChange={(e) => setFormValues({...formValues, category: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Unit Price (₹) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    placeholder="350.00"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                    value={formValues.price}
                    onChange={(e) => setFormValues({...formValues, price: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Current Stock *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="25"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                    value={formValues.current_stock}
                    onChange={(e) => setFormValues({...formValues, current_stock: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Reorder Point</label>
                  <input 
                    type="number" 
                    required
                    placeholder="10"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                    value={formValues.reorder_level}
                    onChange={(e) => setFormValues({...formValues, reorder_level: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Critical Level</label>
                  <input 
                    type="number" 
                    required
                    placeholder="5"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                    value={formValues.critical_threshold}
                    onChange={(e) => setFormValues({...formValues, critical_threshold: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Supplier Partner *</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formValues.supplier_id}
                  onChange={(e) => setFormValues({...formValues, supplier_id: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a supplier</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Image URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://example.com/product.jpg"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formValues.image_url}
                  onChange={(e) => setFormValues({...formValues, image_url: e.target.value})}
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
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-destructive mb-2">Confirm Delete</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Are you sure you want to delete <span className="font-bold text-foreground">"{deletingProduct?.name}"</span>? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-secondary text-foreground font-bold rounded-xl text-xs hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteProduct}
                disabled={submitting}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground font-bold rounded-xl text-xs hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="animate-spin" size={12} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
