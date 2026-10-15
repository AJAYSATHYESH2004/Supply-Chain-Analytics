import React, { useState, useEffect } from 'react';
import { 
  Truck, Star, Phone, Mail, MapPin, 
  Clock, CheckCircle, AlertCircle, Plus, X, Loader2, Edit, Trash2, ShoppingBag,
  LayoutGrid, List, ArrowLeft, Sliders, User, Building2, Search
} from 'lucide-react';
import { suppliersAPI } from '../services/api';
import TypewriterText from '../components/TypewriterText';

const SupplierCard = ({ supplier, onEdit, onDelete, onViewOrders }) => {
  const totalDeliveries = supplier.on_time_deliveries + supplier.late_deliveries;
  const onTimePercentage = totalDeliveries > 0 
    ? Math.round((supplier.on_time_deliveries / totalDeliveries) * 100) 
    : 100;
  
  const status = supplier.rating >= 4.4 ? 'Reliable' : 'Warning';

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:scale-[1.01]">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/50 rounded-xl text-accent group-hover:scale-105 transition-transform">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground line-clamp-1">{supplier.name}</h3>
              <p className="text-[10px] text-muted-foreground font-mono">SUP-{String(supplier.id).padStart(3, '0')}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${status === 'Reliable' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
              {status}
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => onEdit(supplier)} 
                className="p-1 hover:bg-accent/15 text-accent rounded-lg transition-colors"
                title="Edit Details"
              >
                <Edit size={12} />
              </button>
              <button 
                onClick={() => onDelete(supplier)} 
                className="p-1 hover:bg-destructive/15 text-destructive rounded-lg transition-colors"
                title="Delete Supplier"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Star className="text-warning fill-warning" size={14} />
            <span className="font-bold text-foreground">{supplier.rating.toFixed(1)}</span>
            <span>Supplier Rating</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <CheckCircle className="text-success" size={14} />
            <span className="font-bold text-foreground">{onTimePercentage}%</span>
            <span>On-Time Delivery</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Clock className="text-accent" size={14} />
            <span className="font-bold text-foreground">{supplier.avg_delivery_time.toFixed(1)} days</span>
            <span>Avg. Lead Time</span>
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-6 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Phone size={12} className="shrink-0" />
            <span className="truncate">{supplier.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Mail size={12} className="shrink-0" />
            <span className="truncate">{supplier.email}</span>
          </div>
        </div>
      </div>
      <div className="bg-secondary/10 p-4 flex gap-2 border-t border-border/20">
        <button 
          onClick={() => onViewOrders(supplier)}
          className="flex-1 py-2 bg-background border border-border rounded-xl text-xs font-bold hover:bg-secondary/50 transition-colors"
        >
          View Orders
        </button>
        <button 
          onClick={() => onEdit(supplier)}
          className="flex-1 py-2 bg-accent text-accent-foreground rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors shadow-sm"
        >
          Edit Details
        </button>
      </div>
    </div>
  );
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [viewingSupplierOrders, setViewingSupplierOrders] = useState(null);
  
  // Form values state
  const [formValues, setFormValues] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    rating: '4.5',
    avg_delivery_time: '3.0',
    on_time_deliveries: '10',
    late_deliveries: '0'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await suppliersAPI.getAll();
      setSuppliers(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormValues({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      rating: '4.5',
      avg_delivery_time: '3.0',
      on_time_deliveries: '10',
      late_deliveries: '0'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormValues({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address || '',
      rating: String(supplier.rating),
      avg_delivery_time: String(supplier.avg_delivery_time),
      on_time_deliveries: String(supplier.on_time_deliveries),
      late_deliveries: String(supplier.late_deliveries)
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenDeleteConfirm = (supplier) => {
    setDeletingSupplier(supplier);
    setShowDeleteConfirm(true);
  };

  const handleOpenOrdersModal = (supplier) => {
    setViewingSupplierOrders(supplier);
    setShowOrdersModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const payload = {
      name: formValues.name,
      contact_person: formValues.contact_person,
      phone: formValues.phone,
      email: formValues.email,
      address: formValues.address,
      rating: parseFloat(formValues.rating),
      avg_delivery_time: parseFloat(formValues.avg_delivery_time),
      on_time_deliveries: parseInt(formValues.on_time_deliveries),
      late_deliveries: parseInt(formValues.late_deliveries)
    };

    try {
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, payload);
      } else {
        await suppliersAPI.create(payload);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to save supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return;
    setSubmitting(true);
    try {
      await suppliersAPI.delete(deletingSupplier.id);
      setShowDeleteConfirm(false);
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate simulated purchase orders for display
  const getSimulatedOrders = (supplierId) => {
    return [
      { id: `PO-849${supplierId}1`, date: '2026-05-18', amount: '₹1,25,000.00', itemsCount: 12, status: 'DELIVERED' },
      { id: `PO-849${supplierId}2`, date: '2026-05-29', amount: '₹84,500.00', itemsCount: 5, status: 'APPROVED' },
      { id: `PO-849${supplierId}3`, date: '2026-06-03', amount: '₹2,10,000.00', itemsCount: 22, status: 'PENDING' },
    ];
  };

  const filteredSuppliers = suppliers.filter(sup =>
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sup.contact_person && sup.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    sup.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-muted-foreground font-medium">Loading suppliers directory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <TypewriterText text="Suppliers Directory" />
          </h1>
          <p className="text-muted-foreground mt-1">Monitor vendor scorecards, delivery timelines, and contacts.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors group-hover:scale-105" size={18} />
          <input 
            type="text" 
            placeholder="Search suppliers by name or contact..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 focus:scale-[1.01] outline-none transition-all duration-300"
          />
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Grid View"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Table View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Grid or Table layout based on user choice */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredSuppliers.map(sup => (
            <SupplierCard 
              key={sup.id} 
              supplier={sup} 
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteConfirm}
              onViewOrders={handleOpenOrdersModal}
            />
          ))}
          {filteredSuppliers.length === 0 && (
            <div className="col-span-full py-20 text-center bg-card rounded-3xl border-2 border-dashed border-border">
              <Truck size={48} className="mx-auto text-muted-foreground/30 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold">No suppliers found</h3>
              <p className="text-sm text-muted-foreground">No records matched your search query.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Truck size={12} className="text-primary" /> Vendor Partner
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-accent" /> Contact Person
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-primary" /> Communications
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Star size={12} className="text-warning" /> Rating
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock size={12} className="text-accent" /> Lead Time
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
                {filteredSuppliers.map(sup => {
                  const total = sup.on_time_deliveries + sup.late_deliveries;
                  const rate = total > 0 ? Math.round((sup.on_time_deliveries / total) * 100) : 100;
                  return (
                    <tr key={sup.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-sm text-foreground">{sup.name}</div>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase">SUP-{String(sup.id).padStart(3, '0')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">{sup.contact_person || 'Unspecified'}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Phone size={10} className="shrink-0" /> {sup.phone}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail size={10} className="shrink-0" /> {sup.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-bold border border-warning/20">
                          <Star className="fill-warning" size={10} /> {sup.rating.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-foreground">{sup.avg_delivery_time.toFixed(1)} days</span>
                        <div className="text-[9px] text-muted-foreground font-semibold">{rate}% on-time</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenOrdersModal(sup)}
                            className="px-3 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
                          >
                            Orders
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(sup)}
                            className="p-1.5 hover:bg-accent/15 text-accent rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleOpenDeleteConfirm(sup)}
                            className="p-1.5 hover:bg-destructive/15 text-destructive rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <Truck size={48} className="mx-auto text-muted-foreground/15 mb-2" />
                      <p className="text-sm font-bold text-muted-foreground">No suppliers matched search query.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Form View - Redesigned to Immersive FULL PAGE view */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#f1f6f4] dark:bg-[#050b09] overflow-y-auto p-4 md:p-10 flex flex-col justify-start animate-in fade-in duration-300 selection:bg-accent/30">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
            
            {/* Immersive Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/60">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-secondary hover:bg-muted text-foreground rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
                  title="Go Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <Truck className="text-primary" size={28} />
                    {editingSupplier ? 'Modify Vendor Partner Profile' : 'Register New Vendor Partner'}
                  </h1>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium mt-1">
                    Provide complete operational detail, lead timeline calculations, and leadership contacts.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="hidden md:flex p-3 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content: Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Panel: Info Card */}
              <div className="lg:col-span-4 bg-gradient-to-br from-primary/10 via-[#0f766e]/5 to-accent/5 border border-primary/20 rounded-[32px] p-8 shadow-xl relative overflow-hidden hidden lg:block bg-background">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <Truck size={200} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="p-3 bg-primary/20 text-primary rounded-2xl w-fit">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Vendor Profile Integration</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      All metrics are evaluated in real-time by the SmartChain AI Engine to monitor supply risk indexes.
                    </p>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-border/60">
                    <div className="flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                      <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
                      <span className="text-xs font-semibold text-muted-foreground">Automatic lead time telemetry</span>
                    </div>
                    <div className="flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      <span className="text-xs font-semibold text-muted-foreground">Logistics ledger mapping</span>
                    </div>
                    <div className="flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>
                      <span className="text-xs font-semibold text-muted-foreground">Dynamic alert routing rule compatibility</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Responsive Form Card */}
              <div className="lg:col-span-8 bg-background border border-border rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-success opacity-85" />
                
                <form onSubmit={handleFormSubmit} className="space-y-8">
                  
                  {/* Section: Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-2">
                      <Building2 size={14} /> Basic Corporate Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Supplier / Agency Name *</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. CavinKare Personal Care"
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.name}
                            onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Primary Contact Person</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="text" 
                            placeholder="e.g. Alice Johnson"
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.contact_person}
                            onChange={(e) => setFormValues({...formValues, contact_person: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Communications */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-2">
                      <Mail size={14} /> Communications & Address
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Phone Number *</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="text" 
                            required
                            placeholder="+91 99999-99999"
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.phone}
                            onChange={(e) => setFormValues({...formValues, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Email Address *</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="email" 
                            required
                            placeholder="partner@company.com"
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.email}
                            onChange={(e) => setFormValues({...formValues, email: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Office / Warehouse Address</label>
                      <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                        <MapPin className="absolute left-4 top-4 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                        <textarea 
                          rows="3"
                          placeholder="Enter full logistics/corporate office address..."
                          className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground resize-none hover:bg-background/80"
                          value={formValues.address}
                          onChange={(e) => setFormValues({...formValues, address: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Operational Performance */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/60 pb-2">
                      <Sliders size={14} /> Performance Indices & Logistics
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Rating (0-5)</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="number" 
                            min="0"
                            max="5"
                            step="0.1"
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.rating}
                            onChange={(e) => setFormValues({...formValues, rating: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Lead Time (Days)</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="number" 
                            step="0.5"
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.avg_delivery_time}
                            onChange={(e) => setFormValues({...formValues, avg_delivery_time: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">On-Time Count</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="number" 
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.on_time_deliveries}
                            onChange={(e) => setFormValues({...formValues, on_time_deliveries: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Late Count</label>
                        <div className="relative group transition-all duration-200 focus-within:scale-[1.01]">
                          <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={16} />
                          <input 
                            type="number" 
                            className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground hover:bg-background/80"
                            value={formValues.late_deliveries}
                            onChange={(e) => setFormValues({...formValues, late_deliveries: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-semibold flex items-center gap-3">
                      <AlertCircle size={18} />
                      {formError}
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="flex gap-4 pt-6 border-t border-border mt-10 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="px-8 py-3.5 bg-secondary text-foreground font-black rounded-2xl text-sm hover:bg-secondary/80 active:scale-95 transition-all shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="px-10 py-3.5 bg-accent text-accent-foreground font-black rounded-2xl text-sm hover:bg-accent/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/25"
                    >
                      {submitting && <Loader2 className="animate-spin" size={18} />}
                      {editingSupplier ? 'Save Changes' : 'Register Partner'}
                    </button>
                  </div>

                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-destructive mb-2">Confirm Delete</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Are you sure you want to remove <span className="font-bold text-foreground">"{deletingSupplier?.name}"</span>? This will break relation mappings with any linked products.
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
                onClick={handleDeleteSupplier}
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

      {/* View Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowOrdersModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
              <ShoppingBag className="text-accent" size={20} />
              Procurement Orders: {viewingSupplierOrders?.name}
            </h2>
            
            <div className="space-y-3 mt-4">
              {getSimulatedOrders(viewingSupplierOrders?.id).map(order => (
                <div key={order.id} className="p-4 rounded-2xl bg-secondary/35 border border-border/50 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{order.id}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Ordered: {order.date} • {order.itemsCount} Items</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="text-sm font-black text-accent">{order.amount}</p>
                    <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full border ${order.status === 'DELIVERED' ? 'bg-success/15 text-success border-success/20' : order.status === 'APPROVED' ? 'bg-accent/15 text-accent border-accent/20' : 'bg-warning/15 text-warning border-warning/20'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-border pt-4">
              <button 
                onClick={() => setShowOrdersModal(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
