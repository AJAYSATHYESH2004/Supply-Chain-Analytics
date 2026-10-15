import React, { useState, useEffect } from 'react';
import { 
  Users, Check, X, Search, Filter, Plus, Inbox, RefreshCw, LayoutGrid, List as ListIcon, UserCheck, ShieldAlert, Phone, Mail
} from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import TypewriterText from '../components/TypewriterText';

const UserRequests = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isHod = user?.role === 'HOD';

  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // grid, table

  // Modal form for HOD request creation
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    department_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getSignupRequests();
      setRequests(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/v1/departments/');
      setDepartments(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, department_id: response.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchDepartments();
  }, []);

  const handleApprove = async (id) => {
    try {
      await authAPI.approveSignupRequest(id);
      fetchRequests();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await authAPI.rejectSignupRequest(id);
      fetchRequests();
    } catch (err) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const data = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department_id: parseInt(formData.department_id)
      };
      await authAPI.createSignupRequest(data);
      setShowRequestModal(false);
      setFormData({
        username: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        department_id: departments[0]?.id || ''
      });
      fetchRequests();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const statusMatch = statusFilter === 'ALL' || req.status === statusFilter;
    const deptMatch = !deptFilter || req.department_id === parseInt(deptFilter);
    const roleMatch = !roleFilter || req.requested_role === roleFilter;
    const searchMatch = !searchQuery || 
      req.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // HODs should only see requests they generated, or all requests in their department if requested by guests
    const visibilityMatch = isAdmin || (isHod && (req.requested_by === user?.username || req.department_id === user?.department_id));

    return statusMatch && deptMatch && roleMatch && searchMatch && visibilityMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-success bg-success/10 border-success/20';
      case 'REJECTED': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'PENDING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-muted-foreground bg-secondary border-border/30';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="User Creation Governance" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isAdmin 
              ? 'Review and authorize pending user creation requests initiated by HODs.' 
              : 'Submit and track approval states of candidate accounts for your department.'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {isHod && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              <Plus size={16} /> Request User Account
            </button>
          )}
          <button 
            onClick={fetchRequests}
            className="p-2.5 hover:bg-secondary rounded-xl transition-colors border border-border flex items-center justify-center text-muted-foreground"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Status Tab list */}
        <div className="flex gap-1 bg-secondary/40 p-1 rounded-xl border border-border/40 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${statusFilter === st ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-secondary/50 border border-border/40 text-foreground py-2 pl-3 pr-8 text-xs font-bold rounded-xl focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-secondary/50 border border-border/40 text-foreground py-2 pl-3 pr-8 text-xs font-bold rounded-xl focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="HOD">HOD</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
          </div>

          {/* Search bar */}
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search candidate..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2 pl-8 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
            />
          </div>

          {/* View Toggles */}
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
              title="Table/List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* Requests Display */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="p-4 bg-secondary/50 rounded-2xl text-muted-foreground">
            <Users size={40} />
          </div>
          <div className="max-w-xs">
            <h4 className="text-base font-bold text-foreground">No Requests Logged</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin 
                ? 'No signup requests align with your status/department/search parameters.' 
                : 'You have not submitted user requests for approval yet.'}
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.map(req => (
            <div 
              key={req.request_id}
              className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between gap-5 transition-all hover:shadow-lg hover:border-primary/20"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/5">
                    {req.full_name?.substring(0, 2).toUpperCase() || 'US'}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">{req.full_name}</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    ROLE: {req.requested_role}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-muted-foreground/60" />
                    <span className="truncate">{req.email}</span>
                  </div>
                  {req.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-muted-foreground/60" />
                      <span>{req.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="text-[10px]">DEPT: <strong>{req.department}</strong></span>
                    <span className="text-[10px]">BY: <strong>{req.requested_by}</strong></span>
                  </div>
                </div>
              </div>

              {isAdmin && req.status === 'PENDING' && (
                <div className="flex gap-2 border-t border-border/45 pt-4">
                  <button 
                    onClick={() => handleReject(req.request_id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-destructive/20 hover:bg-destructive/10 text-destructive text-xs font-bold rounded-xl transition-all"
                  >
                    <X size={14} /> Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(req.request_id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-success text-white text-xs font-bold rounded-xl hover:bg-success/90 transition-all shadow-md shadow-success/10"
                  >
                    <Check size={14} /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        
        /* Table View */
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border/60">
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Candidate Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email & Contact</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Requested Role</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date Logged</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredRequests.map(req => (
                  <tr key={req.request_id} className="hover:bg-secondary/15 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {req.full_name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <span className="text-xs font-bold text-foreground">{req.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span>{req.email}</span>
                        {req.phone && <span>{req.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-foreground">{req.department}</td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{req.requested_role}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-foreground">{req.requested_by}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleReject(req.request_id)}
                              className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors border border-transparent hover:border-destructive/10"
                              title="Reject Request"
                            >
                              <X size={14} />
                            </button>
                            <button 
                              onClick={() => handleApprove(req.request_id)}
                              className="p-1.5 hover:bg-success/15 text-success rounded-lg transition-colors border border-transparent hover:border-success/10"
                              title="Approve Request"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Creation request Modal for HOD */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateRequest}
            className="bg-card border border-border/80 w-full max-w-md rounded-3xl p-8 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200"
          >
            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">Request Candidate Account</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Submit details for a new department member. Admin approval will create the user with default password 'password123'.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Candidate Username</label>
                <input 
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g. john_doe"
                  className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Candidate Email</label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. john@smartchain.com"
                  className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Contact Number (Optional)</label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 9999988888"
                  className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Requested Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-bold"
                  >
                    <option value="EMPLOYEE">STAFF</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="HOD">HOD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Target Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full bg-secondary/40 border border-border/60 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-foreground font-bold"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4 border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 border border-border/80 hover:bg-secondary font-bold text-xs rounded-xl transition-all text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:bg-primary/95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};

export default UserRequests;
