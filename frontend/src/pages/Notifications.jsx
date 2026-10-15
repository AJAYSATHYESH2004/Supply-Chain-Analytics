import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, Trash2, Archive, ExternalLink, Filter, Search, ChevronLeft, ChevronRight, Inbox, RefreshCw
} from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import TypewriterText from '../components/TypewriterText';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('unread'); // unread, read, archived, all
  const [deptFilter, setDeptFilter] = useState(''); // Empty means all
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotif, setSelectedNotif] = useState(null); // For detail view modal
  const itemsPerPage = 6;

  const departments = ['Inventory', 'Procurement', 'Sales', 'Logistics', 'Finance'];

  const { user } = useAuth();

  // WebSocket hook for real-time notifications
  useWebSocket(user?.id ? `/ws/notifications/${user.id}` : null, (msg) => {
    if (msg.event === 'new_notification' && msg.data) {
      const newNotif = msg.data;
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        
        // Status filter check
        if (statusFilter === 'unread' && newNotif.is_read !== 0) return prev;
        if (statusFilter === 'read' && newNotif.is_read !== 1) return prev;
        if (statusFilter === 'archived' && newNotif.is_archived !== 1) return prev;
        if (statusFilter === 'all' && newNotif.is_archived === 1) return prev;
        
        // Dept filter check
        if (deptFilter && newNotif.department !== deptFilter) return prev;
        
        return [newNotif, ...prev];
      });
    } else if (msg.event === 'notification_read' && msg.data) {
      const notifId = msg.data.id;
      setNotifications(prev => {
        if (statusFilter === 'unread') {
          return prev.filter(n => n.id !== notifId);
        }
        return prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n);
      });
    } else if (msg.event === 'notification_archived' && msg.data) {
      const notifId = msg.data.id;
      setNotifications(prev => {
        if (statusFilter !== 'archived') {
          return prev.filter(n => n.id !== notifId);
        }
        return prev.map(n => n.id === notifId ? { ...n, is_archived: 1 } : n);
      });
    } else if (msg.event === 'notification_deleted' && msg.data) {
      const notifId = msg.data.id;
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } else if (msg.event === 'all_notifications_read') {
      setNotifications(prev => {
        if (statusFilter === 'unread') {
          return [];
        }
        return prev.map(n => ({ ...n, is_read: 1 }));
      });
    }
  }, [user?.id, statusFilter, deptFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getAll(statusFilter, deptFilter);
      setNotifications(data);
      setCurrentPage(1);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [statusFilter, deptFilter]);

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.archive(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTakeAction = (notif) => {
    setSelectedNotif(null);
    switch (notif.type) {
      case 'TASK_ASSIGNED':
        navigate('/tasks');
        break;
      case 'PURCHASE_APPROVAL':
        navigate('/approvals');
        break;
      case 'SUPPLIER_DELAY':
        navigate('/suppliers');
        break;
      case 'INVENTORY_UPDATE':
        navigate('/inventory');
        break;
      case 'FORECAST_ALERT':
        navigate('/forecasting');
        break;
      default:
        navigate('/');
    }
  };

  // Filter local copy by search query
  const filteredNotifications = notifications.filter(notif => {
    const titleMatch = notif.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const msgMatch = notif.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || msgMatch;
  });

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const getPriorityStyle = (priority) => {
    switch (String(priority).toUpperCase()) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-secondary text-muted-foreground border-border/40';
    }
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="Notification Center" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Central monitoring logs and role-specific operational alerts grouped by department.
          </p>
        </div>
        <div className="flex gap-2">
          {statusFilter === 'unread' && notifications.length > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all"
            >
              <Check size={14} /> Mark All Read
            </button>
          )}
          <button 
            onClick={fetchNotifications}
            className="p-2 hover:bg-secondary rounded-xl transition-colors border border-border flex items-center justify-center text-muted-foreground"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Status Tabs */}
        <div className="flex gap-1.5 w-full md:w-auto bg-secondary/40 p-1 rounded-xl border border-border/40">
          {['unread', 'read', 'archived', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${statusFilter === status ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          
          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full sm:w-48 appearance-none bg-secondary/50 border border-border/40 text-foreground py-2 pl-3 pr-8 text-xs font-bold rounded-xl focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

      </div>

      {/* Content Layout */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-secondary/50 rounded-2xl text-muted-foreground">
            <Inbox size={40} />
          </div>
          <div className="max-w-xs">
            <h4 className="text-base font-bold text-foreground">No Notifications Found</h4>
            <p className="text-xs text-muted-foreground mt-1">We couldn't find any notifications matching the current status and search filters.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentItems.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => setSelectedNotif(notif)}
                className={`bg-card p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:border-primary/30 flex flex-col justify-between gap-4 cursor-pointer group ${notif.is_read === 0 ? 'border-primary/20 ring-1 ring-primary/5 bg-gradient-to-tr from-primary/[0.02] to-transparent' : 'border-border/60'}`}
              >
                
                <div className="space-y-2">
                  {/* Meta badges */}
                  <div className="flex justify-between items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getPriorityStyle(notif.priority)}`}>
                      {notif.priority || 'MEDIUM'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(notif.department)}`}>
                      {notif.department || 'GENERAL'}
                    </span>
                  </div>

                  {/* Title and Message */}
                  <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {notif.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Footer details & Action buttons */}
                <div className="border-t border-border/40 pt-4 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {notif.is_read === 0 && (
                      <button 
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        className="p-1.5 hover:bg-success/10 text-muted-foreground hover:text-success rounded-lg transition-colors"
                        title="Dismiss/Mark Read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {notif.is_archived === 0 && (
                      <button 
                        onClick={(e) => handleArchive(notif.id, e)}
                        className="p-1.5 hover:bg-accent/10 text-muted-foreground hover:text-accent rounded-lg transition-colors"
                        title="Archive"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold">
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredNotifications.length)} of {filteredNotifications.length} entries
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 border border-border/60 hover:bg-secondary rounded-lg transition-colors disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors border ${currentPage === idx + 1 ? 'bg-primary border-primary text-primary-foreground' : 'border-border/60 hover:bg-secondary text-muted-foreground'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2 border border-border/60 hover:bg-secondary rounded-lg transition-colors disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Detail View Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-lg rounded-3xl p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getPriorityStyle(selectedNotif.priority)}`}>
                    {selectedNotif.priority || 'MEDIUM'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(selectedNotif.department)}`}>
                    {selectedNotif.department || 'GENERAL'}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-foreground leading-tight">
                  {selectedNotif.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary px-3 py-1 rounded-xl border border-border/40"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/30 p-4 rounded-2xl border border-border/40">
                {selectedNotif.message}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
                <div>
                  <span>Date Created: </span>
                  <span className="text-foreground">{new Date(selectedNotif.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span>Status: </span>
                  <span className={`capitalize ${selectedNotif.is_read === 1 ? 'text-success' : 'text-warning font-bold'}`}>
                    {selectedNotif.is_read === 1 ? 'read' : 'unread'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-border/40 pt-6">
              <button
                onClick={() => handleArchive(selectedNotif.id)}
                className="flex items-center gap-2 px-4 py-2.5 border border-border/80 hover:bg-secondary font-bold text-xs rounded-xl transition-all"
              >
                <Archive size={14} /> Archive
              </button>
              {selectedNotif.is_read === 0 && (
                <button
                  onClick={() => handleMarkRead(selectedNotif.id)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 font-bold text-xs rounded-xl transition-all"
                >
                  <Check size={14} /> Dismiss
                </button>
              )}
              <button
                onClick={() => handleTakeAction(selectedNotif)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:bg-primary/95 transition-all"
              >
                <ExternalLink size={14} /> Take Action
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Notifications;
