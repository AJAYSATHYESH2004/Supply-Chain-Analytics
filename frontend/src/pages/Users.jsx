import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users as UsersIcon, Mail, Shield, Plus, Search, Edit2, Trash2, UserCheck, 
  Building2, ShieldAlert, X, Loader2, Key, Sliders, User, LayoutGrid, List as ListIcon, Info
} from 'lucide-react';
import axios from 'axios';
import TypewriterText from '../components/TypewriterText';

const Users = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Form values state
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    role: 'EMPLOYEE',
    department_id: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setLoading(true);
        const [usersRes, deptsRes] = await Promise.all([
            axios.get('/api/v1/auth/users'), 
            axios.get('/api/v1/departments/')
        ]);
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HOD': return 'bg-primary/10 text-primary border-primary/20';
      case 'MANAGER': return 'bg-accent/10 text-accent border-accent/20';
      case 'EMPLOYEE': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getDeptName = (id) => {
      const dept = departments.find(d => d.id === id);
      return dept ? dept.name : 'Unassigned';
  };

  // Handlers
  const handleOpenAddModal = () => {
    if (isAdmin) return; // RBAC check
    setEditingUser(null);
    setFormValues({
      username: '',
      email: '',
      role: 'EMPLOYEE',
      department_id: departments[0]?.id || '',
      password: 'password123'
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user) => {
    if (isAdmin) return; // RBAC check
    setEditingUser(user);
    setFormValues({
      username: user.username,
      email: user.email,
      role: user.role,
      department_id: user.department_id || '',
      password: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenDeleteConfirm = (user) => {
    if (isAdmin) return; // RBAC check
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) return; // RBAC check
    setSubmitting(true);
    setFormError('');

    if (!formValues.username || !formValues.email || (!editingUser && !formValues.password)) {
      setFormError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    const payload = {
      username: formValues.username,
      email: formValues.email,
      role: formValues.role,
      department_id: formValues.department_id ? parseInt(formValues.department_id) : null
    };

    if (formValues.password) {
      payload.password = formValues.password;
    }

    try {
      if (editingUser) {
        await axios.put(`/api/v1/auth/users/${editingUser.id}`, payload);
      } else {
        await axios.post('/api/v1/auth/users', payload);
      }
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to save user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (isAdmin || !deletingUser) return; // RBAC check
    setSubmitting(true);
    try {
      await axios.delete(`/api/v1/auth/users/${deletingUser.id}`);
      setShowDeleteConfirm(false);
      setDeletingUser(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <TypewriterText text="Identity Management" />
          </h1>
          <p className="text-muted-foreground font-medium">Control access levels and departmental assignments.</p>
        </div>
        {!isAdmin && (
          <button 
              onClick={handleOpenAddModal}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus size={20} /> Create User
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="p-4 bg-secondary/35 border border-border/80 rounded-2xl flex items-start gap-3 text-xs leading-relaxed max-w-xl">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-foreground">Read-Only Governance Console: </span>
            As Admin, you are restricted from creating or editing users directly to enforce segregation of duty policies. Please approve pending accounts requested by Department Heads in the <a href="/user-requests" className="text-primary hover:underline font-bold">User Requests Portal</a>.
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-border">
            <UserCheck className="text-primary mb-4" size={24} />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Identity</p>
            <p className="text-2xl font-black">{users.length}</p>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border">
            <ShieldAlert className="text-destructive mb-4" size={24} />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Super Admins</p>
            <p className="text-2xl font-black">{users.filter(u => u.role === 'SUPER_ADMIN').length}</p>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border">
            <Shield className="text-accent mb-4" size={24} />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Managers</p>
            <p className="text-2xl font-black">{users.filter(u => u.role === 'MANAGER').length}</p>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border">
            <Building2 className="text-success mb-4" size={24} />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Departments</p>
            <p className="text-2xl font-black">{departments.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl border border-border justify-between">
          <div className="relative flex-1 max-w-md w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
            />
          </div>

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
              title="Table View"
            >
              <ListIcon size={15} />
            </button>
          </div>
      </div>

      {/* Users display */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border text-center">
          <UsersIcon size={48} className="mx-auto text-muted-foreground/15 mb-2" />
          <p className="text-sm font-bold text-muted-foreground">No accounts match search filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table Mode */
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-primary" /> Identity
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-accent" /> Contact
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                      <Shield size={12} className="text-success" /> Access Level
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={12} className="text-primary" /> Department
                    </div>
                  </th>
                  {!isAdmin && (
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                      <div className="flex items-center justify-start gap-1.5">
                        <Sliders size={12} className="text-muted-foreground" /> Actions
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white font-black text-[10px]">
                              {user.username?.substring(0, 2).toUpperCase() || 'US'}
                          </div>
                          <span className="font-bold text-sm text-foreground">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Mail size={12} />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground">{getDeptName(user.department_id)}</span>
                      </div>
                    </td>
                    {!isAdmin && (
                      <td className="px-6 py-5">
                        <div className="flex gap-1">
                            <button 
                              onClick={() => handleOpenEditModal(user)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenDeleteConfirm(user)}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <div 
              key={user.id}
              className="bg-card p-6 rounded-3xl border border-border flex flex-col justify-between gap-5 transition-all hover:shadow-lg hover:border-primary/20"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/5">
                    {user.username?.substring(0, 2).toUpperCase() || 'US'}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">{user.username}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Mail size={12} className="text-muted-foreground/60" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border/40 text-xs font-semibold text-muted-foreground">
                  <Building2 size={14} className="text-muted-foreground/60" />
                  <span>DEPARTMENT: <strong>{getDeptName(user.department_id)}</strong></span>
                </div>
              </div>

              {!isAdmin && (
                <div className="flex gap-2 border-t border-border/40 pt-4">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="flex-1 py-2 bg-secondary hover:bg-secondary/80 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={12} /> Edit Details
                  </button>
                  <button
                    onClick={() => handleOpenDeleteConfirm(user)}
                    className="p-2 border border-border/60 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit user Modal */}
      {showAddModal && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-4"
          >
            <h3 className="text-lg font-bold flex items-center gap-2">
              <UserCheck size={18} className="text-primary" />
              {editingUser ? 'Modify User Profile' : 'Register New User'}
            </h3>
            
            {formError && <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-bold">{formError}</p>}
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={formValues.username}
                  onChange={(e) => setFormValues(prev => ({...prev, username: e.target.value}))}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition-all text-foreground font-bold"
                  placeholder="e.g. aditya_roy"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={formValues.email}
                  onChange={(e) => setFormValues(prev => ({...prev, email: e.target.value}))}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition-all text-foreground font-bold"
                  placeholder="e.g. aditya@smartchain.com"
                  required
                />
              </div>

              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Password</label>
                  <input 
                    type="password" 
                    value={formValues.password}
                    onChange={(e) => setFormValues(prev => ({...prev, password: e.target.value}))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition-all text-foreground font-bold"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Role Access</label>
                  <select 
                    value={formValues.role}
                    onChange={(e) => setFormValues(prev => ({...prev, role: e.target.value}))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-all text-foreground font-bold"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="HOD">HOD</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="EMPLOYEE">STAFF</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Department</label>
                  <select 
                    value={formValues.department_id}
                    onChange={(e) => setFormValues(prev => ({...prev, department_id: e.target.value}))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-all text-foreground font-bold"
                  >
                    <option value="">No Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:bg-primary/95 transition-all flex items-center gap-2"
              >
                {submitting && <Loader2 className="animate-spin" size={12} />} Save Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingUser && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Confirm Account Deletion</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to deactivate and permanently delete user <strong className="text-foreground">@{deletingUser.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletingUser(null); }}
                className="px-4 py-2 bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={submitting}
                className="px-5 py-2 bg-destructive text-white font-bold text-xs rounded-xl shadow-lg hover:bg-destructive/90 transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
