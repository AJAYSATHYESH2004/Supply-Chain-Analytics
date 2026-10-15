import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    switch (user.role) {
      case 'SUPER_ADMIN':
        navigate('/dashboard/admin');
        break;
      case 'HOD':
        navigate('/dashboard/hod');
        break;
      case 'MANAGER':
        navigate('/dashboard/manager');
        break;
      case 'EMPLOYEE':
        navigate('/dashboard/employee');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-destructive/30">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-destructive/15 blur-[120px] rounded-full rotate-12" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive to-transparent opacity-50" />
          
          <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full mb-6 border border-destructive/20 text-destructive animate-pulse">
            <ShieldAlert size={48} />
          </div>

          <h1 className="text-3xl font-black text-foreground tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Your current account role does not have the necessary permissions to access this page. Please contact your system administrator if you believe this is an error.
          </p>

          <div className="mt-8">
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-destructive text-white rounded-xl font-bold hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20 active:scale-95 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Return to Safety
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
