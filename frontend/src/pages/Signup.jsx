import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, ShieldCheck, Loader2, BarChart3, CheckCircle2 } from 'lucide-react';

const Signup = () => {
  const { signupRequest } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    requested_role: 'EMPLOYEE',
    department: 'Inventory'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signupRequest(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-3xl text-center shadow-2xl">
          <div className="inline-flex items-center justify-center p-4 bg-success/10 rounded-full mb-6">
            <CheckCircle2 className="text-success" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
          <p className="text-muted-foreground mb-8">
            Your account request for {formData.full_name} has been sent to the administrator. 
            You will be notified via email once approved.
          </p>
          <Link to="/login" className="inline-block w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 transition-all">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Request Access</h1>
          <p className="text-muted-foreground mt-2">Join SmartChain AI Enterprise Platform</p>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                <input
                  type="text"
                  required
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-4 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-4 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                <input
                  type="tel"
                  required
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-4 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Requested Role</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                <select
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-4 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all appearance-none"
                  value={formData.requested_role}
                  onChange={(e) => setFormData({...formData, requested_role: e.target.value})}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HOD">Heads of Department (HOD)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Requested Department</label>
              <div className="grid grid-cols-5 gap-1">
                {['Inventory', 'Procurement', 'Sales', 'Logistics', 'Finance'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData({...formData, department: d})}
                    className={`py-2 text-[8px] font-black uppercase tracking-wider border rounded-xl transition-all ${
                      formData.department === d 
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/10' 
                        : 'bg-background/50 border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-8">
            Already have an account? <Link to="/login" className="text-accent hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
