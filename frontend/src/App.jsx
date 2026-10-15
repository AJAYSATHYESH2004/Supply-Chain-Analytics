import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import HodDashboard from './pages/dashboards/HodDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Departments from './pages/Departments';
import Tasks from './pages/Tasks';
import Approvals from './pages/Approvals';
import AuditLogs from './pages/AuditLogs';
import Forecasting from './pages/Forecasting';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Users from './pages/Users';
import Reports from './pages/Reports';
import RequireRole from './components/RequireRole';
import SuperAdmin from './pages/SuperAdmin';
import Unauthorized from './pages/Unauthorized';
import { ThemeProvider } from './context/ThemeContext';
import States from './pages/States';
import Depots from './pages/Depots';
import DistanceMatrix from './pages/DistanceMatrix';
import Rebalancing from './pages/Rebalancing';
import TransferRecommendations from './pages/TransferRecommendations';
import NetworkMap from './pages/NetworkMap';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Notifications from './pages/Notifications';
import UserRequests from './pages/UserRequests';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Root Redirect Component
const RootRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    
    switch (user.role) {
        case 'SUPER_ADMIN': return <Navigate to="/dashboard/admin" />;
        case 'HOD': return <Navigate to="/dashboard/hod" />;
        case 'MANAGER': return <Navigate to="/dashboard/manager" />;
        case 'EMPLOYEE': return <Navigate to="/dashboard/employee" />;
        default: return <Navigate to="/dashboard/employee" />;
    }
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }> 
        <Route index element={<RootRedirect />} />
        
        {/* Module Routes */}
        <Route path="products" element={<RequireRole roles={['SUPER_ADMIN']}><Products /></RequireRole>} />
        <Route path="suppliers" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Suppliers /></RequireRole>} />
        <Route path="inventory" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Inventory /></RequireRole>} />
        <Route path="sales" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Sales /></RequireRole>} />
        <Route path="departments" element={<RequireRole roles={['SUPER_ADMIN', 'HOD']}><Departments /></RequireRole>} />
        <Route path="tasks" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Tasks /></RequireRole>} />
        <Route path="approvals" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER']}><Approvals /></RequireRole>} />
        <Route path="forecasting" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Forecasting /></RequireRole>} />
        <Route path="alerts" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Alerts /></RequireRole>} />
        <Route path="reports" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Reports /></RequireRole>} />
        <Route path="users" element={<RequireRole roles={['SUPER_ADMIN', 'HOD']}><Users /></RequireRole>} />
        <Route path="audit-logs" element={<RequireRole roles={['SUPER_ADMIN']}><AuditLogs /></RequireRole>} />
        <Route path="states" element={<RequireRole roles={['SUPER_ADMIN']}><States /></RequireRole>} />
        <Route path="depots" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER']}><Depots /></RequireRole>} />
        <Route path="distance-matrix" element={<RequireRole roles={['SUPER_ADMIN']}><DistanceMatrix /></RequireRole>} />
        <Route path="rebalancing" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><Rebalancing /></RequireRole>} />
        <Route path="transfer-recommendations" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><TransferRecommendations /></RequireRole>} />
        <Route path="network-map" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><NetworkMap /></RequireRole>} />
        <Route path="profile" element={<Profile />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="user-requests" element={<RequireRole roles={['SUPER_ADMIN', 'HOD']}><UserRequests /></RequireRole>} />
        
        {/* Role-specific dashboard views */}
        <Route path="dashboard/admin" element={<RequireRole roles={['SUPER_ADMIN']}><AdminDashboard /></RequireRole>} />
        <Route path="dashboard/hod" element={<RequireRole roles={['SUPER_ADMIN', 'HOD']}><HodDashboard /></RequireRole>} />
        <Route path="dashboard/manager" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER']}><ManagerDashboard /></RequireRole>} />
        <Route path="dashboard/employee" element={<RequireRole roles={['SUPER_ADMIN', 'HOD', 'MANAGER', 'EMPLOYEE']}><EmployeeDashboard /></RequireRole>} />
        
        {/* Super admin specialized page */}
        <Route
          path="superadmin"
          element={
            <RequireRole roles={["SUPER_ADMIN"]}>
              <SuperAdmin />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
