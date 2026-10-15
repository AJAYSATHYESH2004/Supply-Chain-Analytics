import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Shield, 
  Terminal, User, Activity, Clock, FileText, Download, Loader2, LayoutGrid, List as ListIcon, Calendar, CheckSquare, Settings
} from 'lucide-react';
import axios from 'axios';
import TypewriterText from '../components/TypewriterText';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // table, grid

    // Filter states
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Export formats
    const [exportFormat, setExportFormat] = useState('csv');
    const [exporting, setExporting] = useState(false);

    const actionTypes = [
      'LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
      'APPROVE_USER', 'REJECT_USER', 'APPROVE_TRANSFER', 'REJECT_TRANSFER',
      'APPROVE_PRODUCTION', 'REJECT_PRODUCTION', 'REBALANCE_CALCULATE'
    ];

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [selectedUser, selectedDept, selectedAction, startDate, endDate]);

    const fetchInitialData = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          axios.get('/api/v1/auth/users'),
          axios.get('/api/v1/departments/')
        ]);
        setUsersList(usersRes.data);
        setDepartments(deptsRes.data);
      } catch (err) {
        console.error("Failed to load users or departments:", err);
      }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedUser) params.user_id = selectedUser;
            if (selectedDept) params.department_id = selectedDept;
            if (selectedAction) params.action_type = selectedAction;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await axios.get('/api/v1/audit-logs/', { params });
            setLogs(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setLoading(false);
        }
    };

    const handleExport = async () => {
      setExporting(true);
      try {
        const token = localStorage.getItem('access_token');
        const params = new URLSearchParams();
        params.append('format', exportFormat);
        if (selectedUser) params.append('user_id', selectedUser);
        if (selectedDept) params.append('department_id', selectedDept);
        if (selectedAction) params.append('action_type', selectedAction);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(`http://localhost:8000/api/v1/audit-logs/export?${params.toString()}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) throw new Error('Export download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const extension = exportFormat === 'excel' ? 'xlsx' : exportFormat;
        link.setAttribute('download', `audit_trail_report.${extension}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } catch (err) {
        console.error(err);
        alert('Failed to export audit logs.');
      } finally {
        setExporting(false);
      }
    };

    // Filter local copies using text search
    const filteredLogs = logs.filter(log => 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getActionBadgeColor = (action) => {
      const act = String(action).toUpperCase();
      if (act.includes('DELETE') || act.includes('REJECT')) {
        return 'bg-destructive/10 text-destructive border-destructive/20';
      }
      if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('LOGIN')) {
        return 'bg-success/10 text-success border-success/20';
      }
      return 'bg-primary/10 text-primary border-primary/20';
    };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Shield className="text-primary" size={32} />
             <TypewriterText text="System Audit Trail" />
          </h1>
          <p className="text-muted-foreground font-medium">Immutable record of all critical system actions, user configurations, and governance events.</p>
        </div>
      </div>

      {/* Control Panel / Filter Form */}
      <div className="bg-card p-6 rounded-3xl border border-border space-y-4 shadow-sm">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* User Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Operator</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground py-2 px-3 text-xs font-semibold rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="">All Users</option>
              {usersList.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground py-2 px-3 text-xs font-semibold rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Action Type</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground py-2 px-3 text-xs font-semibold rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="">All Actions</option>
              {actionTypes.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Start Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground py-1.5 px-3 text-xs font-semibold rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">End Date</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground py-1.5 px-3 text-xs font-semibold rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

        </div>

        {/* Search, Export and View Modes */}
        <div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="relative flex-1 max-w-md w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Quick search details or modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:bg-background focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Format selection */}
            <div className="flex bg-secondary/50 border border-border/50 p-0.5 rounded-xl">
              {['csv', 'excel', 'pdf'].map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                    exportFormat === fmt 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border font-bold text-xs rounded-xl transition-all disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="animate-spin text-primary" size={14} />
              ) : (
                <Download size={14} className="text-primary" />
              )}
              Export Trail
            </button>

            {/* View switcher */}
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

      </div>

      {/* Audit Log Output */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-card py-20 rounded-3xl border border-border text-center shadow-sm">
          <History size={48} className="mx-auto text-muted-foreground/15 mb-2" />
          <p className="text-sm font-bold text-muted-foreground">No audit trail logs match specified parameters.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table Mode */
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getActionBadgeColor(log.action)}`}>
                         {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-secondary rounded-full border border-border/40">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-semibold text-foreground">{log.operator_name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">{log.department || 'Corporate'}</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{log.ip_address || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate" title={log.details}>
                      {log.details || 'No additional details.'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
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
          {filteredLogs.map(log => (
            <div 
              key={log.id}
              className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between gap-4 transition-all hover:shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${getActionBadgeColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2 py-0.5 bg-secondary rounded-full border border-border/40">
                    {log.module}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-foreground">Operator: {log.operator_name}</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    DEPARTMENT: {log.department || 'Corporate'}
                  </span>
                </div>

                <div className="bg-secondary/35 p-3 rounded-xl border border-border/40 text-xs italic text-muted-foreground leading-relaxed min-h-[44px]">
                  "{log.details || 'No details logged.'}"
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1"><Clock size={11} /> {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="font-mono">IP: {log.ip_address || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default AuditLogs;
