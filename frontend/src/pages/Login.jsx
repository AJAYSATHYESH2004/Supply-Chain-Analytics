import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Loader2, BarChart3, CheckSquare } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password, rememberMe);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Invalid username or password. Please try again.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-accent/30">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full rotate-12" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-2xl mb-4 border border-accent/20">
            <BarChart3 className="text-accent" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">SmartChain AI</h1>
          <p className="text-muted-foreground mt-2">Enterprise Supply Chain Management</p>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type="text"
                  required
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-4 text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all placeholder:text-muted-foreground/40"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-muted-foreground">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-accent hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-12 text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all placeholder:text-muted-foreground/40"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    id="remember" 
                    className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground">Remember Me</label>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm animate-shake">
                <span className="shrink-0 font-bold">!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 focus:ring-4 focus:ring-accent/20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Sign In
                  <BarChart3 className="group-hover:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
              Quick Demo Access
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="px-3 py-2 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all text-center"
              >
                System Admin
              </button>
              <button
                type="button"
                onClick={() => { setUsername('hod'); setPassword('hod123'); }}
                className="px-3 py-2 text-xs font-bold bg-accent/10 text-accent border border-accent/20 rounded-xl hover:bg-accent/20 transition-all text-center"
              >
                Operations HOD
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase text-center">Department Accounts</p>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: 'Inventory', mgr: 'inventory_manager', staff: 'inventory_staff' },
                  { label: 'Procurement', mgr: 'procurement_manager', staff: 'procurement_staff' },
                  { label: 'Sales', mgr: 'sales_manager', staff: 'sales_staff' },
                  { label: 'Logistics', mgr: 'logistics_manager', staff: 'logistics_staff' },
                  { label: 'Finance', mgr: 'finance_manager', staff: 'finance_staff' }
                ].map(dept => (
                  <div key={dept.label} className="bg-secondary/35 p-1 rounded-lg border border-border flex flex-col gap-1 items-stretch">
                    <span className="text-[8px] font-black text-foreground truncate text-center">{dept.label}</span>
                    <button
                      type="button"
                      onClick={() => { setUsername(dept.mgr); setPassword('manager123'); }}
                      className="py-0.5 text-[7px] font-black bg-background text-primary hover:bg-primary hover:text-white rounded border border-primary/10 transition-all"
                    >
                      MGR
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUsername(dept.staff); setPassword('staff123'); }}
                      className="py-0.5 text-[7px] font-black bg-background text-muted-foreground hover:bg-secondary rounded border border-border transition-all"
                    >
                      STF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground text-sm mt-8">
            Don't have an account? <Link to="/signup" className="text-accent hover:underline font-medium">Request Access</Link>
          </p>
        </div>
        
        <p className="text-center text-muted-foreground/60 text-xs mt-8 uppercase tracking-widest font-medium">
          Powered by Smart Supply Chain AI v2.0
        </p>
      </div>
    </div>
  );
};

export default Login;
