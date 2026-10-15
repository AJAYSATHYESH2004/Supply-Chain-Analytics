import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, Clock, 
  MessageSquare, FileText, ArrowRight, UserCheck, 
  Search, Filter, LayoutGrid, List as ListIcon, Loader2
} from 'lucide-react';
import axios from 'axios';
import TypewriterText from '../components/TypewriterText';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';

const Approvals = () => {
    const [approvals, setApprovals] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING');
    const [deptFilter, setDeptFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // table, grid

    const { user } = useAuth();

    // WebSocket hook for approvals updates
    useWebSocket(user?.id ? `/ws/approvals/${user.id}` : null, (msg) => {
        if (msg.event === 'approval_update' && msg.data) {
            const updatedApproval = msg.data;
            setApprovals(prev => {
                const exists = prev.some(a => a.id === updatedApproval.id);
                if (updatedApproval.status === activeTab) {
                    if (exists) {
                        return prev.map(a => a.id === updatedApproval.id ? updatedApproval : a);
                    } else {
                        return [updatedApproval, ...prev];
                    }
                } else {
                    if (exists) {
                        return prev.filter(a => a.id !== updatedApproval.id);
                    }
                    return prev;
                }
            });
        }
    }, [user?.id, activeTab]);

    // Comment modals or input fields for reviewing
    const [reviewingId, setReviewingId] = useState(null);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [activeTab]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [approvalsRes, usersRes] = await Promise.all([
                axios.get('/api/v1/approvals/', { params: { status: activeTab } }),
                axios.get('/api/v1/auth/users')
            ]);
            setApprovals(approvalsRes.data);
            setUsersList(usersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const getRequesterName = (id) => {
        const u = usersList.find(x => x.id === id);
        return u ? u.username : `User #${id}`;
    };

    const getRequesterDept = (id) => {
        const u = usersList.find(x => x.id === id);
        return u ? u.department_name : 'General';
    };

    const handleAction = async (id, status) => {
        setSubmittingAction(true);
        try {
            await axios.put(`/api/v1/approvals/${id}/approve`, { 
                status,
                comments: reviewComment || `Status set to ${status.toLowerCase()}`
            });
            setReviewingId(null);
            setReviewComment('');
            // Refresh
            const approvalsRes = await axios.get('/api/v1/approvals/', { params: { status: activeTab } });
            setApprovals(approvalsRes.data);
        } catch (error) {
            console.error('Error approving request:', error);
            alert(error.response?.data?.detail || 'Approval action failed');
        } finally {
            setSubmittingAction(false);
        }
    };

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

    const filteredApprovals = approvals.filter(req => {
      const requesterDept = getRequesterDept(req.requested_by);
      const matchesDept = !deptFilter || requesterDept === deptFilter;
      const matchesSearch = !searchTerm || 
        req.request_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRequesterName(req.requested_by).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.comments && req.comments.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDept && matchesSearch;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <UserCheck className="text-primary" size={32} />
            <TypewriterText text="Approval Center" />
          </h1>
          <p className="text-muted-foreground font-medium">Review and authorize organizational rebalancing and procurement requests.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Status Tabs */}
        <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/40 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['PENDING', 'APPROVED', 'REJECTED'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters and View toggles */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          
          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-secondary/50 border border-border/40 text-foreground py-2.5 pl-3 pr-8 text-xs font-bold rounded-xl focus:outline-none focus:border-primary cursor-pointer"
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
              placeholder="Search approvals..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2.5 pl-8 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
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
              title="Table View"
            >
              <ListIcon size={15} />
            </button>
          </div>

        </div>

      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
            {[1, 2].map(i => <div key={i} className="h-32 bg-secondary/20 rounded-3xl animate-pulse"></div>)}
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="py-32 text-center bg-card rounded-3xl border border-border shadow-sm">
             <ShieldCheck size={64} className="mx-auto text-muted-foreground/15 mb-4" />
             <h3 className="text-lg font-bold text-muted-foreground">Queue is Clear</h3>
             <p className="text-sm text-muted-foreground/50">All requests in this section have been resolved.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table Mode */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">Request Code</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Requester</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Comments</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApprovals.map(req => (
                  <tr key={req.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-xs text-foreground">REQ-{String(req.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase">{req.request_type}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-foreground">
                      {getRequesterName(req.requested_by)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(getRequesterDept(req.requested_by))}`}>
                        {getRequesterDept(req.requested_by)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground italic max-w-xs truncate">
                      "{req.comments || 'No comments'}"
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-1.5">
                        {activeTab === 'PENDING' ? (
                          reviewingId === req.id ? (
                            <div className="flex flex-col gap-2 p-2 bg-secondary/50 rounded-xl max-w-xs border border-border/40 animate-in fade-in">
                              <input 
                                type="text"
                                placeholder="Add review comment..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="bg-background border border-border text-foreground px-2 py-1 rounded text-xs outline-none"
                              />
                              <div className="flex gap-1 justify-end">
                                <button 
                                  onClick={() => { setReviewingId(null); setReviewComment(''); }}
                                  className="px-2 py-1 bg-secondary text-muted-foreground rounded text-[10px] font-bold"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleAction(req.id, 'REJECTED')}
                                  disabled={submittingAction}
                                  className="px-2.5 py-1 bg-destructive text-white rounded text-[10px] font-bold"
                                >
                                  Reject
                                </button>
                                <button 
                                  onClick={() => handleAction(req.id, 'APPROVED')}
                                  disabled={submittingAction}
                                  className="px-2.5 py-1 bg-success text-white rounded text-[10px] font-bold"
                                >
                                  Approve
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewingId(req.id)}
                              className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg shadow-sm"
                            >
                              Authorize
                            </button>
                          )
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${activeTab === 'APPROVED' ? 'text-success bg-success/10 border-success/20' : 'text-destructive bg-destructive/10 border-destructive/20'}`}>
                            {activeTab}
                          </span>
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
        
        /* Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApprovals.map(req => (
            <div 
              key={req.id}
              className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between gap-5 transition-all hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">REQ-{String(req.id).padStart(3, '0')}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getDepartmentColor(getRequesterDept(req.requested_by))}`}>
                    {getRequesterDept(req.requested_by)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2 py-0.5 bg-secondary rounded border border-border/40">
                      {req.request_type}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mt-1.5">Procurement / Rebalance Request</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Submitted by: <strong>{getRequesterName(req.requested_by)}</strong>
                  </span>
                </div>

                <div className="bg-secondary/35 p-3 rounded-xl border border-border/40 text-xs italic text-muted-foreground min-h-[44px] flex items-center gap-2 leading-relaxed">
                  <MessageSquare size={12} className="shrink-0 text-muted-foreground/60" />
                  <span>"{req.comments || 'No description comments logged.'}"</span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold mb-1">
                  <span>LOGGED: {new Date(req.created_at).toLocaleDateString()}</span>
                  <span>STATUS: <strong>{req.status}</strong></span>
                </div>

                {activeTab === 'PENDING' && (
                  reviewingId === req.id ? (
                    <div className="flex flex-col gap-2 bg-secondary/40 p-2 rounded-xl border border-border/40">
                      <input 
                        type="text"
                        placeholder="Add review comment..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="bg-background border border-border text-foreground px-2 py-1.5 rounded text-xs outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => { setReviewingId(null); setReviewComment(''); }}
                          className="px-3 py-1 bg-secondary text-muted-foreground rounded text-[10px] font-bold border border-border"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'REJECTED')}
                          disabled={submittingAction}
                          className="px-3.5 py-1 bg-destructive text-white rounded text-[10px] font-bold"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'APPROVED')}
                          disabled={submittingAction}
                          className="px-3.5 py-1 bg-success text-white rounded text-[10px] font-bold"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setReviewingId(req.id)}
                      className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md"
                    >
                      Process Approval
                    </button>
                  )
                )}

                {activeTab !== 'PENDING' && (
                  <div className="flex items-center justify-center gap-2 py-1.5 bg-secondary/50 rounded-xl">
                    {activeTab === 'APPROVED' ? <CheckCircle2 size={14} className="text-success" /> : <XCircle size={14} className="text-destructive" />}
                    <span className={`text-[10px] font-black uppercase ${activeTab === 'APPROVED' ? 'text-success' : 'text-destructive'}`}>
                      {activeTab}
                    </span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Approvals;
