import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { ShieldAlert, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and password confirmation do not match.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        old_password: formData.oldPassword,
        new_password: formData.newPassword
      });
      setSuccess(true);
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to update user password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter">
          <TypewriterText text="Update Password" />
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          Secure your account by changing your login access key.
        </p>
      </div>

      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <KeyRound size={20} className="text-primary" /> Credentials Key
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Please provide your current verification key followed by the new credentials.</p>
        </div>

        {success && (
          <div className="p-4 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-2xl flex items-center gap-2.5">
            <CheckCircle2 size={16} /> Password successfully updated!
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl flex items-center gap-2.5">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Current Password</label>
            <input 
              type="password"
              required
              value={formData.oldPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">New Password</label>
            <input 
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
            <input 
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-bold"
            />
          </div>

          <div className="border-t border-border/40 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-lg hover:bg-primary/95 transition-all disabled:opacity-50"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default ChangePassword;
