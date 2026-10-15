import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Pencil, Trash2, User, MoreHorizontal, Search, Settings as SettingsIcon, Type, Trash
} from 'lucide-react';

// Helper component for the Toggle
const Toggle = ({ active, onChange }) => (
  <div 
    onClick={onChange}
    className={`w-11 h-6 rounded-full flex items-center cursor-pointer p-0.5 transition-colors duration-300 ${active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`} />
  </div>
);

const NavItem = ({ label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`cursor-pointer py-1.5 text-sm font-bold transition-all ${
      active 
        ? 'text-primary underline underline-offset-8 decoration-2' 
        : 'text-foreground/70 hover:text-foreground'
    }`}
  >
    {label}
  </div>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [toggles, setToggles] = useState({
    opt1: false,
    textAlignment: true,
    opt2: false,
    deleteItems: false,
  });

  useEffect(() => {
    axios.get('/api/v1/settings/')
      .then(res => {
        const data = res.data;
        if (data && !data.detail) {
          setToggles({
            opt1: data.opt1 || false,
            textAlignment: data.textAlignment ?? true,
            opt2: data.opt2 || false,
            deleteItems: data.deleteItems || false,
          });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch settings", err);
        setIsLoading(false);
      });
  }, []);

  const handleToggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await axios.post('/api/v1/settings/', toggles);
      if (res.status === 200) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex justify-center pb-12 selection:bg-primary/20">
      <div className="w-full max-w-[1000px] bg-card rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-border overflow-hidden flex flex-col p-10 md:p-14">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Harrison" 
              alt="Profile" 
              className="w-12 h-12 rounded-full bg-secondary object-cover"
            />
            <div>
              <h2 className="font-bold text-foreground text-sm">Harrison Pfannerstill</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Last edited 11-12-13, 8:13AM</p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2.5">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm shadow-primary/30">
              <Pencil size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-muted transition-colors">
              <Trash2 size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-muted transition-colors">
              <User size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-muted transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Title & Search */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-12">
          <h1 className="text-5xl font-extrabold text-foreground tracking-tight">Settings</h1>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search settings..." 
              className="w-full bg-secondary/50 text-sm border border-transparent rounded-full py-2.5 pl-10 pr-4 focus:bg-card focus:border-border focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-foreground placeholder-muted-foreground/60"
            />
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Sidebar */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <div className="space-y-8">
              {/* Account */}
              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4">Account</h3>
                <div className="space-y-3">
                  <NavItem label="Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
                  <NavItem label="Google account" active={activeTab === 'Google account'} onClick={() => setActiveTab('Google account')} />
                </div>
              </div>

              {/* Connections */}
              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4">Connections</h3>
                <div className="space-y-3">
                  <NavItem label="Email integration" active={activeTab === 'Email integration'} onClick={() => setActiveTab('Email integration')} />
                  <NavItem label="Calendar Sync" active={activeTab === 'Calendar Sync'} onClick={() => setActiveTab('Calendar Sync')} />
                  <NavItem label="Contact Sync" active={activeTab === 'Contact Sync'} onClick={() => setActiveTab('Contact Sync')} />
                  <NavItem label="Google Drive" active={activeTab === 'Google Drive'} onClick={() => setActiveTab('Google Drive')} />
                  <NavItem label="MailChimp" active={activeTab === 'MailChimp'} onClick={() => setActiveTab('MailChimp')} />
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4">Preferences</h3>
                <div className="space-y-3">
                  <NavItem label="User interface" active={activeTab === 'User interface'} onClick={() => setActiveTab('User interface')} />
                  <NavItem label="Activity reminder emails" active={activeTab === 'Activity reminder emails'} onClick={() => setActiveTab('Activity reminder emails')} />
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4">Security</h3>
                <div className="space-y-3">
                  <NavItem label="Change password" active={activeTab === 'Change password'} onClick={() => setActiveTab('Change password')} />
                  <NavItem label="Login verification" active={activeTab === 'Login verification'} onClick={() => setActiveTab('Login verification')} />
                  <NavItem label="Devices" active={activeTab === 'Devices'} onClick={() => setActiveTab('Devices')} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 max-w-2xl">
            {/* Header description */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">Notification settings</h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed font-medium">
                By default, designers will be notified by your company's preferred dark patterns. Employees can also customize their notification preferences by logging into the{' '}
                <span className="text-primary font-bold cursor-pointer hover:underline">Setproduct dashboard</span>
              </p>
            </div>

            {/* Primary Settings */}
            <div className="mb-8">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Primary Settings</h3>
              <div className="space-y-4">
                
                {/* Card 1 */}
                <div className="border border-border rounded-2xl p-4 md:px-6 md:py-5 flex items-center justify-between shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-secondary/40 border border-border flex items-center justify-center text-muted-foreground">
                      <SettingsIcon size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-foreground mb-0.5">Setting option disabled</h4>
                      <p className="text-[13px] font-medium text-muted-foreground">Describe here what it is for</p>
                    </div>
                  </div>
                  <Toggle active={toggles.opt1} onChange={() => handleToggle('opt1')} />
                </div>

                {/* Card 2 (Active state demo) */}
                <div className={`border rounded-2xl p-4 md:px-6 md:py-5 flex items-center justify-between transition-all ${
                  toggles.textAlignment 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-card border-border shadow-sm hover:shadow-md'
                }`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                      toggles.textAlignment 
                        ? 'bg-primary/20 border-transparent text-primary' 
                        : 'bg-secondary/40 border-border text-muted-foreground'
                    }`}>
                      <Type size={20} className={toggles.textAlignment ? 'text-primary' : ''} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-foreground mb-0.5">Automatically text alignment</h4>
                      <p className={`text-[13px] font-medium ${toggles.textAlignment ? 'text-primary/80 dark:text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        This is unuseful experimental feature
                      </p>
                    </div>
                  </div>
                  <Toggle active={toggles.textAlignment} onChange={() => handleToggle('textAlignment')} />
                </div>

              </div>
            </div>

            {/* Secondary Options */}
            <div className="mb-10">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Secondary Options</h3>
              <div className="space-y-4">
                
                {/* Card 3 */}
                <div className="border border-border rounded-2xl p-4 md:px-6 md:py-5 flex items-center justify-between shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-secondary/40 border border-border flex items-center justify-center text-muted-foreground">
                      <SettingsIcon size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-foreground mb-0.5">Setting option disabled</h4>
                      <p className="text-[13px] font-medium text-muted-foreground">Here is the onhovered statement</p>
                    </div>
                  </div>
                  <Toggle active={toggles.opt2} onChange={() => handleToggle('opt2')} />
                </div>

                {/* Card 4 */}
                <div className="border border-border rounded-2xl p-4 md:px-6 md:py-5 flex items-center justify-between shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-secondary/40 border border-border flex items-center justify-center text-muted-foreground">
                      <Trash size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-foreground mb-0.5">Automatically delete items</h4>
                      <p className="text-[13px] font-medium text-muted-foreground">Get rid of sh*t and keep working hard</p>
                    </div>
                  </div>
                  <Toggle active={toggles.deleteItems} onChange={() => handleToggle('deleteItems')} />
                </div>

              </div>
            </div>

            {/* Save Button */}
            <div className="relative pt-4 flex items-center gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="w-full max-w-[340px] h-[52px] flex justify-center items-center bg-primary hover:opacity-90 active:scale-95 text-primary-foreground font-bold text-[15px] rounded-2xl transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:active:scale-100"
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
              {saveSuccess && <span className="text-primary font-bold text-sm tracking-wide">Saved successfully!</span>}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
