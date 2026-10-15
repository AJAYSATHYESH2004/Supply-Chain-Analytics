import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Sun, Moon, LogOut, Settings, 
  AlertTriangle, ChevronDown, UserSquare2, 
  MapPin, CheckSquare, FileCheck, Truck, Boxes, TrendingUp,
  CheckCircle, ShieldCheck, Menu
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationsAPI, alertsAPI } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Dropdown states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  
  // Data states
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  // Fetch all notifications and alerts data
  const fetchCountsAndData = async () => {
    if (!user) return;
    try {
      // Notifications
      const notifs = await notificationsAPI.getAll();
      setNotifications(notifs);
      const unreadNotifs = notifs.filter(n => n.is_read === 0).length;
      setUnreadNotifCount(unreadNotifs);

      // Alerts
      const alrts = await alertsAPI.getUnread();
      setAlerts(alrts);
      setUnreadAlertCount(alrts.length);
    } catch (err) {
      console.error("Failed to fetch notification or alert counts", err);
    }
  };

  // WebSocket hooks for real-time updates
  useWebSocket(user?.id ? `/ws/alerts/${user.id}` : null, (msg) => {
    if (msg.event === 'new_alert' && msg.data) {
      setAlerts(prev => {
        if (prev.some(a => (a.alert_id || a.id) === (msg.data.alert_id || msg.data.id))) return prev;
        return [msg.data, ...prev];
      });
      setUnreadAlertCount(prev => prev + 1);
    } else if (msg.event === 'alert_read' && msg.data) {
      const alertId = msg.data.alert_id;
      setAlerts(prev => prev.map(a => (a.alert_id || a.id) === alertId ? { ...a, is_read: 1 } : a));
      setUnreadAlertCount(prev => Math.max(0, prev - 1));
    } else if (msg.event === 'alert_archived' && msg.data) {
      const alertId = msg.data.alert_id;
      setAlerts(prev => prev.filter(a => (a.alert_id || a.id) !== alertId));
      setUnreadAlertCount(prev => Math.max(0, prev - 1));
    } else if (msg.event === 'all_alerts_read') {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
      setUnreadAlertCount(0);
    }
  }, [user?.id]);

  useWebSocket(user?.id ? `/ws/notifications/${user.id}` : null, (msg) => {
    if (msg.event === 'new_notification' && msg.data) {
      setNotifications(prev => {
        if (prev.some(n => n.id === msg.data.id)) return prev;
        return [msg.data, ...prev];
      });
      setUnreadNotifCount(prev => prev + 1);
    } else if (msg.event === 'notification_read' && msg.data) {
      const notifId = msg.data.id;
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } else if (msg.event === 'all_notifications_read') {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadNotifCount(0);
    } else if (msg.event === 'notification_archived' || msg.event === 'notification_deleted') {
      const notifId = msg.data.id;
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    }
  }, [user?.id]);

  useEffect(() => {
    // Initial load of counts and data
    fetchCountsAndData();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Notification action handlers
  const handleMarkNotifRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markRead(id);
      fetchCountsAndData();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      fetchCountsAndData();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (notif.is_read === 0) {
        await notificationsAPI.markRead(notif.id);
      }
      setShowNotifications(false);
      fetchCountsAndData();
      
      // Navigate to target route
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
    } catch (err) {
      console.error("Failed to process notification click", err);
    }
  };

  // Alert action handlers
  const handleMarkAlertRead = async (id, e) => {
    e.stopPropagation();
    try {
      await alertsAPI.markRead(id);
      fetchCountsAndData();
    } catch (err) {
      console.error("Failed to mark alert as read", err);
    }
  };

  const handleMarkAllAlertsRead = async () => {
    try {
      await alertsAPI.markAllRead();
      fetchCountsAndData();
    } catch (err) {
      console.error("Failed to mark all alerts as read", err);
    }
  };

  const handleAlertClick = async (alert) => {
    try {
      if (alert.is_read === 0) {
        await alertsAPI.markRead(alert.alert_id);
      }
      setShowAlerts(false);
      fetchCountsAndData();
      navigate('/alerts');
    } catch (err) {
      console.error("Failed to process alert click", err);
    }
  };

  // Helper icons for notifications
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <CheckSquare size={16} className="text-primary" />;
      case 'PURCHASE_APPROVAL':
        return <FileCheck size={16} className="text-accent" />;
      case 'SUPPLIER_DELAY':
        return <Truck size={16} className="text-warning" />;
      case 'INVENTORY_UPDATE':
        return <Boxes size={16} className="text-destructive" />;
      case 'FORECAST_ALERT':
        return <TrendingUp size={16} className="text-success" />;
      default:
        return <Bell size={16} className="text-muted-foreground" />;
    }
  };

  // Helper styles for alerts priority
  const getAlertPriorityColor = (priority) => {
    switch (String(priority).toUpperCase()) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-secondary text-muted-foreground border-border';
    }
  };

  // Role display name mapper
  const getMappedRole = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'SUPER ADMIN';
      case 'HOD':
        return 'HEAD OF DEPARTMENT';
      case 'MANAGER':
        return 'INVENTORY MANAGER';
      case 'EMPLOYEE':
        return 'INVENTORY STAFF';
      default:
        return role ? role.replace('_', ' ') : 'MEMBER';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 z-40 relative">
      
      {/* Left section: Hamburger & Department Name */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu on mobile */}
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-secondary rounded-xl md:hidden text-muted-foreground transition-colors"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        {/* User Department Display */}
        <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-lg border border-border">
          <Boxes size={14} className="text-primary" />
          <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
            {user?.username || 'Corporate'}
          </span>
        </div>
      </div>

      {/* Center: Global Search */}
      {user?.role !== 'SUPER_ADMIN' && (
        <div className="flex-1 max-w-xl px-6 hidden lg:block">
          <div className="relative w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search products, orders, intelligence..." 
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-full py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 focus:scale-[1.01] outline-none transition-all duration-300"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none opacity-50">
              <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-muted-foreground bg-background border border-border rounded">⌘</kbd>
              <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-muted-foreground bg-background border border-border rounded">K</kbd>
            </div>
          </div>
        </div>
      )}
      
      {/* Right section: Utilities */}
      <div className="flex items-center gap-1.5">
        
        {/* Alerts Dropdown Trigger */}
        <div className="relative">
          <button 
            onClick={() => { setShowAlerts(!showAlerts); setShowNotifications(false); setShowProfileMenu(false); }}
            className="p-2 hover:bg-secondary rounded-xl transition-colors relative group" 
            title="System Alerts"
          >
            <AlertTriangle size={18} className={unreadAlertCount > 0 ? "text-destructive animate-bounce" : "text-amber-500"} />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-destructive text-[8px] font-black text-white px-1 rounded-full flex items-center justify-center border border-background shadow-sm">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute top-12 right-0 w-80 dropdown-menu rounded-2xl py-2 z-50 animate-dropdown">
              <div className="px-4 py-2.5 border-b border-border/50 flex justify-between items-center">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  System Alerts ({unreadAlertCount})
                </span>
                {unreadAlertCount > 0 && (
                  <button 
                    onClick={handleMarkAllAlertsRead}
                    className="text-[10px] text-accent hover:underline font-bold uppercase tracking-wider"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {alerts.length > 0 ? (
                  alerts.map(alert => (
                    <div 
                      key={alert.alert_id || alert.id} 
                      onClick={() => handleAlertClick(alert)}
                      className="px-4 py-3 hover:bg-secondary/40 transition-colors border-b border-border/30 last:border-0 cursor-pointer flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border ${getAlertPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <button 
                          onClick={(e) => handleMarkAlertRead(alert.alert_id, e)}
                          className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                        >
                          Mark read
                        </button>
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug">{alert.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-normal">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground text-xs font-medium">
                    No active unread alerts.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown Trigger */}
        <div className="relative">
          <button 
            onClick={() => { navigate('/notifications'); setShowNotifications(false); setShowAlerts(false); setShowProfileMenu(false); }}
            className="p-2 hover:bg-secondary rounded-xl transition-colors relative group" 
            title="Notifications"
          >
            <Bell size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-primary text-[8px] font-black text-primary-foreground px-1 rounded-full flex items-center justify-center border border-background shadow-sm">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 dropdown-menu rounded-2xl py-2 z-50 animate-dropdown">
              <div className="px-4 py-2.5 border-b border-border/50 flex justify-between items-center">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Bell size={16} className="text-primary" />
                  Notifications ({unreadNotifCount})
                </span>
                {unreadNotifCount > 0 && (
                  <button 
                    onClick={handleMarkAllNotifsRead}
                    className="text-[10px] text-accent hover:underline font-bold uppercase tracking-wider"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 hover:bg-secondary/40 transition-colors border-b border-border/30 last:border-0 cursor-pointer flex gap-3 items-start ${notif.is_read === 0 ? "bg-accent/5 font-semibold" : ""}`}
                    >
                      <div className="p-2 bg-secondary rounded-lg shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <p className="text-xs text-foreground truncate">{notif.title}</p>
                          {notif.is_read === 0 && (
                            <button 
                              onClick={(e) => handleMarkNotifRead(notif.id, e)}
                              className="text-[8px] text-accent hover:underline uppercase shrink-0 font-bold tracking-widest mt-0.5"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{notif.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground text-xs font-medium">
                    No notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground" 
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="h-4 w-px bg-border mx-2"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); setShowAlerts(false); }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-secondary transition-colors pr-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white font-bold text-xs ring-2 ring-background shadow-md">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-none mb-0.5">{user?.username || 'User'}</p>
              <p className="text-[10px] font-medium text-muted-foreground leading-none">
                {getMappedRole(user?.role)}
              </p>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground ml-1 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute top-12 right-0 w-60 dropdown-menu rounded-2xl py-2 z-50 animate-dropdown">
              <div className="px-4 py-3 border-b border-border/50 mb-2">
                <p className="text-sm font-bold text-foreground">{user?.username}</p>
                <p className="text-[10px] text-muted-foreground">{user?.email}</p>
              </div>
              <button 
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground text-left"
              >
                <UserSquare2 size={16} /> My Profile
              </button>
              <button 
                onClick={() => { setShowProfileMenu(false); navigate('/change-password'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground text-left"
              >
                <ShieldCheck size={16} /> Change Password
              </button>
              <div className="my-2 border-t border-border/50"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
