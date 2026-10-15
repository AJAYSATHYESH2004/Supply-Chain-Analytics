import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, AlertTriangle, AlertCircle, ShoppingCart, 
  Truck, Search, Filter, Archive, CheckCircle2,
  LayoutGrid, List as ListIcon, ShieldAlert, Info
} from 'lucide-react';
import TypewriterText from '../components/TypewriterText';
import { useWebSocket } from '../hooks/useWebSocket';

const Alerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // table, grid

  const departments = ['Inventory', 'Procurement', 'Sales', 'Logistics', 'Finance'];

  // WebSocket hook for real-time alerts
  useWebSocket(user?.id ? `/ws/alerts/${user.id}` : null, (msg) => {
    if (msg.event === 'new_alert' && msg.data) {
      const newAlert = msg.data;
      setAlerts(prev => {
        if (prev.some(a => (a.alert_id || a.id) === (newAlert.alert_id || newAlert.id))) return prev;
        return [newAlert, ...prev];
      });
    } else if (msg.event === 'alert_read' && msg.data) {
      const alertId = msg.data.alert_id;
      setAlerts(prev => prev.map(a => (a.alert_id || a.id) === alertId ? { ...a, is_read: 1 } : a));
    } else if (msg.event === 'alert_archived' && msg.data) {
      const alertId = msg.data.alert_id;
      setAlerts(prev => prev.map(a => (a.alert_id || a.id) === alertId ? { ...a, is_archived: 1 } : a));
    } else if (msg.event === 'all_alerts_read') {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertsAPI.getAll('all'); // Fetch all active and archived
      setAlerts(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (isAdmin) return; // RBAC Check
    try {
      await alertsAPI.markAllRead();
      fetchAlerts();
    } catch (err) {
      console.error("Failed to mark all alerts as read", err);
    }
  };

  const handleDismiss = async (alertId) => {
    if (isAdmin) return; // RBAC Check
    try {
      await alertsAPI.markRead(alertId);
      fetchAlerts();
    } catch (err) {
      console.error("Failed to dismiss alert", err);
    }
  };

  const handleArchive = async (alertId) => {
    if (isAdmin) return; // RBAC Check
    try {
      await alertsAPI.archive(alertId);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTakeAction = (alert) => {
    const combined = String(alert.title || alert.type || alert.message || '').toUpperCase();
    if (combined.includes('STOCK') || combined.includes('SHORTAGE') || combined.includes('OVERSTOCK') || combined.includes('INVENTORY')) {
      navigate('/inventory');
    } else if (combined.includes('APPROVAL') || combined.includes('APPROVE') || combined.includes('PENDING APPROVAL')) {
      navigate('/approvals');
    } else if (combined.includes('TASK') || combined.includes('ASSIGN')) {
      navigate('/tasks');
    } else if (combined.includes('DELAY') || combined.includes('SUPPLIER') || combined.includes('SHIPMENT')) {
      navigate('/suppliers');
    } else if (combined.includes('DEMAND') || combined.includes('SPIKE') || combined.includes('FORECAST')) {
      navigate('/forecasting');
    } else if (combined.includes('SALES') || combined.includes('REVENUE')) {
      navigate('/sales');
    } else {
      navigate('/inventory');
    }
  };

  const getPriorityStyles = (priority) => {
    const p = String(priority).toUpperCase();
    switch (p) {
      case 'CRITICAL': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH': return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM': return 'bg-accent/10 text-accent border-accent/20';
      case 'LOW': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getIcon = (title, type) => {
    const combined = String(title || type || '').toUpperCase();
    if (combined.includes('STOCK') || combined.includes('SHORTAGE')) {
      return <AlertTriangle className="text-destructive" size={18} />;
    } else if (combined.includes('DEMAND') || combined.includes('SPIKE')) {
      return <AlertCircle className="text-accent" size={18} />;
    } else if (combined.includes('DELAY')) {
      return <Truck className="text-warning" size={18} />;
    } else if (combined.includes('OVERSTOCK')) {
      return <ShoppingCart className="text-success" size={18} />;
    }
    return <Bell className="text-muted-foreground" size={18} />;
  };

  const formatPriority = (p) => {
    const s = String(p).toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const getDepartmentColor = (dept) => {
    switch (dept) {
      case 'Inventory': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Procurement': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Sales': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Logistics': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Finance': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-secondary border-border/30';
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const priorityMatch = filter === 'All' || formatPriority(a.priority) === filter;
    const deptMatch = !deptFilter || a.department === deptFilter;
    const searchMatch = !searchTerm || 
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return priorityMatch && deptMatch && searchMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <TypewriterText text="System Alerts" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage and respond to AI-generated system alerts.</p>
        </div>
        
        {!isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl text-xs font-bold hover:bg-secondary/80 transition-colors"
            >
              <Archive size={14} /> Archive All
            </button>
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/10"
            >
              <CheckCircle2 size={14} /> Mark All Read
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="p-4 bg-secondary/35 border border-border/80 rounded-2xl flex items-start gap-3 text-xs leading-relaxed max-w-xl">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-foreground">Read-Only View: </span>
            As Admin, you are restricted from dismissing or archiving alerts directly. Access actions are monitored for compliance.
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Priority Filter */}
        <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/40 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filter === p ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Search, Dept filter and view toggle */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          
          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-secondary/50 border border-border/40 text-foreground py-2.5 pl-3 pr-8 text-xs font-bold rounded-xl focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
          </div>

          {/* Search bar */}
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search alerts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-8 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
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

      {/* Main content display */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
          <Bell className="mx-auto text-muted-foreground/15 mb-2" size={48} />
          <p className="text-sm font-bold text-muted-foreground">No alerts found for this selection.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table Mode */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Alert Info</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timestamp</th>
                  {!isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAlerts.map(alert => (
                  <tr key={alert.alert_id || alert.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getPriorityStyles(alert.priority)}`}>
                        {formatPriority(alert.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="p-2 bg-secondary/30 rounded-lg shrink-0">
                          {getIcon(alert.title, alert.type)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground">{alert.title || alert.type || 'System Alert'}</div>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{alert.message}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(alert.department)}`}>
                        {alert.department || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold ${alert.is_read !== 0 ? 'text-muted-foreground' : 'text-warning'}`}>
                        {alert.is_read !== 0 ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    {!isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          {alert.is_read === 0 && (
                            <>
                              <button 
                                onClick={() => handleTakeAction(alert)}
                                className="px-2.5 py-1.5 bg-primary/15 hover:bg-primary/25 text-primary text-[10px] font-black uppercase rounded-lg transition-colors"
                              >
                                Action
                              </button>
                              <button 
                                onClick={() => handleDismiss(alert.alert_id || alert.id)}
                                className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground text-[10px] font-black uppercase rounded-lg transition-colors"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
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
          {filteredAlerts.map(alert => {
            const alertId = alert.alert_id || alert.id;
            const isRead = alert.is_read !== 0;
            return (
              <div 
                key={alertId}
                className={`bg-card p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 hover:shadow-lg ${!isRead ? 'border-primary/20 bg-gradient-to-tr from-primary/[0.01] to-transparent shadow-sm' : 'border-border/60 grayscale-[0.4] opacity-80'}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getPriorityStyles(alert.priority)}`}>
                      {formatPriority(alert.priority)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(alert.department)}`}>
                      {alert.department || 'GENERAL'}
                    </span>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-secondary/50 rounded-lg shrink-0 mt-0.5">
                      {getIcon(alert.title, alert.type)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-foreground">{alert.title || alert.type || 'System Alert'}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-3">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>{new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  
                  {!isAdmin && !isRead && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleTakeAction(alert)}
                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-bold rounded-lg transition-colors"
                      >
                        Action
                      </button>
                      <button 
                        onClick={() => handleDismiss(alertId)}
                        className="px-2.5 py-1 bg-secondary text-muted-foreground hover:text-foreground text-[9px] font-bold rounded-lg transition-colors border border-border/40"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
