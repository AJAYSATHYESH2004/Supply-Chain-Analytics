import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-3xl text-center">
          <div className="inline-flex items-center justify-center p-4 bg-success/10 rounded-full mb-6">
            <CheckCircle2 className="text-success" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset Successful!</h2>
          <p className="text-muted-foreground mb-6">Your password has been updated. Redirecting to login...</p>
          <Link to="/login" className="text-accent hover:underline">Click here if not redirected</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Set New Password</h1>
          <p className="text-muted-foreground mt-2">Almost there! Choose a strong password</p>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl">
          {!token ? (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center">
              Invalid or expired reset link. Please request a new one from the login page.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-12 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground ml-1">Confirm New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-12 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-destructive text-sm text-center font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
