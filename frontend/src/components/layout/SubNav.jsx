import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  ShoppingCart, 
  TrendingUp, 
  Bell, 
  BarChart3, 
  Users, 
  Boxes,
  CheckSquare,
  FileCheck,
  History,
  Map,
  GitCompare,
  Route,
  MapPin
} from 'lucide-react';

const SubNav = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  
  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
    { title: 'Network Map', icon: <Map size={18} />, path: '/network-map', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Rebalancing', icon: <GitCompare size={18} />, path: '/rebalancing', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Transfer Recs', icon: <FileCheck size={18} />, path: '/transfer-recommendations', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'States', icon: <Boxes size={18} />, path: '/states', roles: ['SUPER_ADMIN'] },
    { title: 'Depots', icon: <MapPin size={18} />, path: '/depots', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER'] },
    { title: 'Distance Matrix', icon: <Route size={18} />, path: '/distance-matrix', roles: ['SUPER_ADMIN'] },
    { title: 'Products', icon: <Package size={18} />, path: '/products', roles: ['SUPER_ADMIN'] },
    { title: 'Inventory', icon: <Boxes size={18} />, path: '/inventory', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Suppliers', icon: <Truck size={18} />, path: '/suppliers', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Sales', icon: <ShoppingCart size={18} />, path: '/sales', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Departments', icon: <Boxes size={18} />, path: '/departments', roles: ['SUPER_ADMIN', 'HOD'] },
    { title: 'Forecasting', icon: <TrendingUp size={18} />, path: '/forecasting', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Alerts', icon: <Bell size={18} />, path: '/alerts', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Notifications', icon: <Bell size={18} />, path: '/notifications', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Tasks', icon: <CheckSquare size={18} />, path: '/tasks', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Approvals', icon: <FileCheck size={18} />, path: '/approvals', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'User Requests', icon: <FileCheck size={18} />, path: '/user-requests', roles: ['SUPER_ADMIN', 'HOD'] },
    { title: 'Reports', icon: <BarChart3 size={18} />, path: '/reports', roles: ['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Users', icon: <Users size={18} />, path: '/users', roles: ['SUPER_ADMIN', 'HOD'] },
    { title: 'Audit Logs', icon: <History size={18} />, path: '/audit-logs', roles: ['SUPER_ADMIN'] },
  ];

  const deptLinks = {
    'Inventory': {
      allowedPaths: ['/', '/network-map', '/rebalancing', '/inventory', '/alerts', '/notifications', '/tasks'],
      managerOnlyPaths: ['/transfer-recommendations']
    },
    'Procurement': {
      allowedPaths: ['/', '/suppliers', '/alerts', '/notifications', '/tasks'],
      managerOnlyPaths: ['/approvals']
    },
    'Sales': {
      allowedPaths: ['/', '/sales', '/forecasting', '/alerts', '/notifications', '/tasks'],
      managerOnlyPaths: []
    },
    'Logistics': {
      allowedPaths: ['/', '/network-map', '/rebalancing', '/transfer-recommendations', '/alerts', '/notifications', '/tasks'],
      managerOnlyPaths: []
    },
    'Finance': {
      allowedPaths: ['/', '/reports', '/alerts', '/notifications', '/tasks'],
      managerOnlyPaths: []
    }
  };

  const allowedMenuItems = menuItems.filter(item => {
    // 1. Check roles
    if (item.roles && (!user || !item.roles.includes(user.role))) {
      return false;
    }
    
    // 2. Check department-based restrictions (for Managers and Employees/Staff)
    if (user && (user.role === 'MANAGER' || user.role === 'EMPLOYEE')) {
      const dept = user.department_name;
      const deptRules = deptLinks[dept];
      if (deptRules) {
        const isAllowed = deptRules.allowedPaths.includes(item.path);
        const isManagerAllowed = deptRules.managerOnlyPaths.includes(item.path) && user.role === 'MANAGER';
        if (!isAllowed && !isManagerAllowed) {
          return false;
        }
      }
    }
    
    return true;
  });

  return (
    <>
      {/* Mobile Drawer Overlay / Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/45 z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col h-screen shrink-0
        transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:flex
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header (Logo & Brand Name) */}
        <div className="h-16 border-b border-border flex items-center px-6 gap-2.5">
          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm tracking-tighter shadow-sm">
            SC
          </div>
          <span className="font-extrabold text-lg tracking-tight text-foreground">SmartChain AI</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {allowedMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15 scale-[1.01]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'}
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default SubNav;
