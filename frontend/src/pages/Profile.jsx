import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { User, Mail, Shield, Building2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const Profile = () => {
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    
    try {
      const updatedUser = await usersAPI.update(user.id, formData);
      
      // Update local storage to reflect changes
      const updatedUserData = { ...user, username: updatedUser.username, email: updatedUser.email };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      setSuccess(true);
      setTimeout(() => {
        // Force reload to update Context & Topbar
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const getMappedRole = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'SUPER ADMIN';
      case 'HOD': return 'HEAD OF DEPARTMENT';
      case 'MANAGER': return 'INVENTORY MANAGER';
      case 'EMPLOYEE': return 'INVENTORY STAFF';
      default: return role || 'MEMBER';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter">
          <TypewriterText text="Account Settings" />
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          Review your credentials, department registration, and edit contact properties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Summary Card */}
        <div className="bg-card border border-border p-6 rounded-3xl flex flex-col items-center justify-between text-center gap-6 shadow-sm">
          <div className="space-y-4 w-full flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white font-black text-3xl ring-4 ring-background shadow-xl">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            
            <div>
              <h3 className="text-lg font-black text-foreground">{user?.username}</h3>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">{user?.email}</p>
            </div>

            <div className="w-full h-px bg-border/45 my-2"></div>

            <div className="w-full space-y-2 text-left">
              <div className="flex items-center gap-3 p-3 bg-secondary/35 rounded-xl border border-border/40 text-xs">
                <Shield size={16} className="text-primary" />
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1">Access Tier</p>
                  <span className="font-bold text-foreground">{getMappedRole(user?.role)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/35 rounded-xl border border-border/40 text-xs">
                <Building2 size={16} className="text-accent" />
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1">Department</p>
                  <span className="font-bold text-foreground">{user?.department_name || 'Corporate'}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 bg-destructive/10 hover:bg-destructive/15 text-destructive font-bold text-xs rounded-xl transition-all border border-destructive/20"
          >
            Logout Session
          </button>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 bg-card border border-border p-8 rounded-3xl shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">Edit Profile Credentials</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Keep your work credentials up to date to receive correct reports and alert notifications.</p>
          </div>

          {success && (
            <div className="p-4 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 size={16} /> Profile details saved! Refreshing portal...
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl flex items-center gap-2.5">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} /> Username Handle
              </label>
              <input 
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-foreground font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} /> Contact Email Address
              </label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-foreground font-bold"
              />
            </div>

            <div className="border-t border-border/40 pt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-lg hover:bg-primary/95 transition-all disabled:opacity-50"
              >
                <Save size={14} /> {loading ? 'Saving Profile...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
