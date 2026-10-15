import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, Plus, 
  Search, Filter, ListCheck, Calendar, 
  ArrowUpRight, User as UserIcon, X, Loader2,
  Trash2, LayoutGrid, List as ListIcon
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TypewriterText from '../components/TypewriterText';

const Tasks = () => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'SUPER_ADMIN';
    const isManager = currentUser?.role === 'MANAGER';
    const isHod = currentUser?.role === 'HOD';

    const [tasks, setTasks] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [deptFilter, setDeptFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // table, grid

    // Modals state
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingTask, setDeletingTask] = useState(null);
    
    // Form values state
    const [formValues, setFormValues] = useState({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'MEDIUM',
      status: 'PENDING'
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchTasksAndUsers();
    }, [filterStatus]);

    const fetchTasksAndUsers = async () => {
        try {
            setLoading(true);
            const params = filterStatus !== 'ALL' ? { status: filterStatus } : {};
            const [tasksRes, usersRes] = await Promise.all([
                axios.get('/api/v1/tasks/', { params }),
                axios.get('/api/v1/auth/users')
            ]);
            setTasks(tasksRes.data);
            setUsersList(usersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks and users:', error);
            setLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-success/10 text-success border-success/20';
            case 'IN_PROGRESS': return 'bg-primary/10 text-primary border-primary/20';
            case 'PENDING': return 'bg-warning/10 text-warning border-warning/20';
            default: return 'bg-secondary text-muted-foreground border-border';
        }
    };

    const getAssigneeName = (id) => {
        const u = usersList.find(x => x.id === id);
        return u ? u.username : `User #${id}`;
    };

    // CRUD Handlers
    const handleOpenAddModal = () => {
        if (isAdmin) return; // RBAC Check
        setEditingTask(null);
        setFormValues({
          title: '',
          description: '',
          assigned_to: usersList[0]?.id || '',
          priority: 'MEDIUM',
          status: 'PENDING'
        });
        setFormError('');
        setShowModal(true);
    };

    const handleOpenEditModal = (task) => {
        setEditingTask(task);
        setFormValues({
          title: task.title,
          description: task.description || '',
          assigned_to: task.assigned_to,
          priority: task.priority || 'MEDIUM',
          status: task.status || 'PENDING'
        });
        setFormError('');
        setShowModal(true);
    };

    const handleOpenDeleteConfirm = (task) => {
        if (isAdmin) return; // RBAC Check
        setDeletingTask(task);
        setShowDeleteConfirm(true);
    };

    const handleDeleteTask = async () => {
        if (isAdmin) return; // RBAC Check
        try {
            await axios.delete(`/api/v1/tasks/${deletingTask.id}`);
            setShowDeleteConfirm(false);
            fetchTasksAndUsers();
        } catch (err) {
            console.error(err);
            alert('Failed to delete task.');
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        if (!formValues.title || !formValues.assigned_to) {
          setFormError('Please fill in required fields.');
          setSubmitting(false);
          return;
        }

        const payload = {
          title: formValues.title,
          description: formValues.description,
          assigned_to: parseInt(formValues.assigned_to),
          priority: formValues.priority,
          status: formValues.status
        };

        try {
          if (editingTask) {
            await axios.put(`/api/v1/tasks/${editingTask.id}`, payload);
          } else {
            if (isAdmin) return; // double check
            await axios.post('/api/v1/tasks/', payload);
          }
          setShowModal(false);
          fetchTasksAndUsers();
        } catch (err) {
          console.error(err);
          setFormError(err.response?.data?.detail || 'Failed to save task.');
        } finally {
          setSubmitting(false);
        }
    };

    const filteredTasks = tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        getAssigneeName(t.assigned_to).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = !deptFilter || t.department_name === deptFilter;
      return matchesSearch && matchesDept;
    });

    const getDepartmentColor = (dept) => {
      switch (dept) {
        case 'Inventory': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        case 'Procurement': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        case 'Sales': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        case 'Logistics': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
        case 'Finance': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        default: return 'text-muted-foreground bg-secondary border-border/30';
      }
    };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <ListIcon className="text-primary" size={32} />
            <TypewriterText text="Operations Tasks" />
          </h1>
          <p className="text-muted-foreground font-medium">Coordinate supply chain duties and track progress.</p>
        </div>
        {!isAdmin && (isManager || isHod) && (
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} /> Assign Task
          </button>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Status Filter */}
        <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/40 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterStatus === status ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {status}
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
              className="appearance-none bg-secondary/50 border border-border/40 text-foreground py-2.5 pl-3 pr-8 text-xs font-bold rounded-xl focus:outline-none focus:border-primary cursor-pointer animate-in fade-in"
            >
              <option value="">All Departments</option>
              <option value="Inventory">Inventory</option>
              <option value="Procurement">Procurement</option>
              <option value="Sales">Sales</option>
              <option value="Logistics">Logistics</option>
              <option value="Finance">Finance</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
          </div>

          {/* Search bar */}
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-8 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
            />
          </div>

          {/* View Mode */}
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

      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border text-center shadow-sm">
          <ListCheck size={48} className="mx-auto text-muted-foreground/15 mb-2" />
          <p className="text-sm font-bold text-muted-foreground">No operations tasks found.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table View */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Task Details</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider border ${getStatusStyles(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-xs text-foreground">{task.title}</div>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{task.description || 'No instructions.'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(task.department_name)}`}>
                        {task.department_name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border ${task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {task.priority || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-foreground">{getAssigneeName(task.assigned_to)}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(task.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(task)}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase rounded-lg transition-colors"
                        >
                          {isAdmin ? 'View Details' : 'Update'}
                        </button>
                        {!isAdmin && (isManager || isHod) && (
                          <button 
                            onClick={() => handleOpenDeleteConfirm(task)}
                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors border border-transparent"
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <div 
              key={task.id}
              className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between gap-4 transition-all hover:shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(task.department_name)}`}>
                    {task.department_name || 'General'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider border ${getStatusStyles(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{task.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px] line-clamp-2 leading-relaxed">
                    {task.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
                  <div className="bg-secondary/35 p-2 rounded-xl border border-border/40 text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Priority</p>
                    <span className={`text-[9px] font-bold ${task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'text-destructive' : 'text-primary'}`}>
                      {task.priority || 'MEDIUM'}
                    </span>
                  </div>
                  <div className="bg-secondary/35 p-2 rounded-xl border border-border/40 text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Assignee</p>
                    <span className="text-xs font-bold text-foreground truncate block">
                      {getAssigneeName(task.assigned_to)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-border/40 pt-4">
                <button
                  onClick={() => handleOpenEditModal(task)}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all"
                >
                  {isAdmin ? 'View Task Details' : 'Update Status'}
                </button>
                {!isAdmin && (isManager || isHod) && (
                  <button
                    onClick={() => handleOpenDeleteConfirm(task)}
                    className="p-2 border border-border/60 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign / Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ListCheck className="text-accent" size={22} />
              {isAdmin ? 'View Operation Task Details' : editingTask ? 'Update Operation Task' : 'Assign Operations Task'}
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Task Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Audit warehouse sector 4"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-60 text-foreground font-bold"
                  value={formValues.title}
                  onChange={(e) => setFormValues({...formValues, title: e.target.value})}
                  disabled={isAdmin || currentUser?.role === 'EMPLOYEE'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Description / Instruction</label>
                <textarea 
                  rows="3"
                  placeholder="Provide detailed instructions for the assignee..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-60 text-foreground font-medium"
                  value={formValues.description}
                  onChange={(e) => setFormValues({...formValues, description: e.target.value})}
                  disabled={isAdmin || currentUser?.role === 'EMPLOYEE'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Assignee *</label>
                  <select 
                    value={formValues.assigned_to}
                    onChange={(e) => setFormValues({...formValues, assigned_to: e.target.value})}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60 font-bold"
                    required
                    disabled={isAdmin || currentUser?.role === 'EMPLOYEE'}
                  >
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Priority</label>
                  <select 
                    value={formValues.priority}
                    onChange={(e) => setFormValues({...formValues, priority: e.target.value})}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60 font-bold"
                    disabled={isAdmin || currentUser?.role === 'EMPLOYEE'}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
                  <select 
                    value={formValues.status}
                    onChange={(e) => setFormValues({...formValues, status: e.target.value})}
                    className="w-full bg-secondary/30 border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60 font-bold"
                    disabled={isAdmin}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              {formError && <p className="text-xs text-destructive font-semibold">{formError}</p>}

              <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-colors"
                >
                  {isAdmin ? 'Close' : 'Cancel'}
                </button>
                {!isAdmin && (
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:bg-primary/95 transition-all flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="animate-spin" size={12} />} Save Task
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingTask && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-foreground">Confirm Task Deletion</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete task <strong className="text-foreground">"{deletingTask.title}"</strong>?
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletingTask(null); }}
                className="px-4 py-2 bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-5 py-2 bg-destructive text-white font-bold text-xs rounded-xl shadow-lg hover:bg-destructive/90 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
