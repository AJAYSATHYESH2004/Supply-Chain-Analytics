import React, { useState, useEffect } from 'react';
import { 
  Warehouse, Boxes, CheckSquare, AlertTriangle, ArrowRight, Loader2, Activity,
  ClipboardList, Truck, ShoppingCart, Landmark, UserCheck, Sparkles, TrendingUp
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import TypewriterText from '../../components/TypewriterText';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

const StatCard = ({ title, value, icon: Icon, color, change }) => {
  const gradientStyles = {
    accent: "bg-gradient-to-br from-[#10b981]/8 via-card to-[#059669]/3 border-[#10b981]/15 text-[#0f766e] hover:border-[#10b981]/30 hover:shadow-lg",
    success: "bg-gradient-to-br from-[#3b82f6]/8 via-card to-[#1d4ed8]/3 border-[#3b82f6]/15 text-[#1d4ed8] hover:border-[#3b82f6]/30 hover:shadow-lg",
    warning: "bg-gradient-to-br from-[#f59e0b]/8 via-card to-[#d97706]/3 border-[#f59e0b]/15 text-[#d97706] hover:border-[#f59e0b]/30 hover:shadow-lg",
    primary: "bg-gradient-to-br from-[#ef4444]/8 via-card to-[#b91c1c]/3 border-[#ef4444]/15 text-[#b91c1c] hover:border-[#ef4444]/30 hover:shadow-lg"
  };

  const style = gradientStyles[color] || "bg-card border-border hover:shadow-xl text-foreground";

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] group ${style}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-background/60 text-current transition-colors shadow-sm">
          <Icon size={24} />
        </div>
        {change && (
          <div className="text-[10px] font-black uppercase tracking-wider bg-background/40 px-2 py-0.5 rounded-full border border-border/20">
            {change}
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black mt-1 text-foreground">{value}</h3>
    </div>
  );
};

const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getEmployeeData();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch employee dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // WebSocket for real-time dashboard updates
  useWebSocket('/ws/dashboard', (msg) => {
    if (msg.event === 'refresh_dashboard') {
      fetchStats();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-muted-foreground font-medium">Fetching workstation status...</div>
      </div>
    );
  }

  const dept = data?.department_name || 'Inventory';
  const opMetrics = data?.operational_metrics || {};
  const tasksPending = data?.tasks_pending || 0;
  const notificationsCount = data?.notifications?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text={`Workstation: ${dept} Staff`} />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {dept === 'Inventory' && "Depot level ledger updates, stock receipts tracking, and movement logging."}
            {dept === 'Procurement' && "Vendor catalog coordination, purchase requisition creation, and order tracking."}
            {dept === 'Sales' && "Record customer sales transactions, check pricing matrices, and submit demand logs."}
            {dept === 'Logistics' && "Route verification checksheets, vehicle fleet tracking, and delivery logs."}
            {dept === 'Finance' && "Check budget ledger entries, log payment claims, and verify invoices."}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-xs font-bold border border-border">
            <Activity size={14} className="text-success" />
            ROLE: {dept.toUpperCase()} STAFF
          </div>
        </div>
      </div>

      {/* ─── RENDER CARDS BY DEPARTMENT ─── */}
      {dept === 'Inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Network Hubs" value="10" icon={Warehouse} color="accent" change="Operating" />
          <StatCard title="Assigned Tasks" value={tasksPending} icon={CheckSquare} color="warning" change="Pending" />
          <StatCard title="Pending Movements" value={opMetrics.pending_movements?.length || 0} icon={Boxes} color="success" change="Stock Movements" />
          <StatCard title="System Notifications" value={notificationsCount} icon={AlertTriangle} color="primary" change="Unresolved" />
        </div>
      )}

      {dept === 'Procurement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Approved Suppliers" value={opMetrics.suppliers?.length || 0} icon={Truck} color="success" change="Vendors" />
          <StatCard title="Requisitions Pending" value={data.pending_requests?.length || 0} icon={ClipboardList} color="warning" change="My Requests" />
          <StatCard title="Assigned Tasks" value={tasksPending} icon={CheckSquare} color="accent" change="Pending Tasks" />
          <StatCard title="System Notifications" value={notificationsCount} icon={AlertTriangle} color="primary" change="Alerts" />
        </div>
      )}

      {dept === 'Sales' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Recent Sales Orders" value={opMetrics.recent_sales?.length || 0} icon={ShoppingCart} color="success" change="Processed" />
          <StatCard title="Pending Tasks" value={tasksPending} icon={CheckSquare} color="warning" change="Workstation Tasks" />
          <StatCard title="In Progress Tasks" value={data.tasks_in_progress || 0} icon={Boxes} color="accent" change="Doing" />
          <StatCard title="System Notifications" value={notificationsCount} icon={AlertTriangle} color="primary" change="Alerts" />
        </div>
      )}

      {dept === 'Logistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Route Shipments" value={opMetrics.active_shipments?.length || 0} icon={Truck} color="accent" change="In Transit" />
          <StatCard title="Pending Tasks" value={tasksPending} icon={CheckSquare} color="warning" change="Logs Required" />
          <StatCard title="Completed Checklists" value={data.tasks_completed || 0} icon={UserCheck} color="success" change="Completed" />
          <StatCard title="System Notifications" value={notificationsCount} icon={AlertTriangle} color="primary" change="Alerts" />
        </div>
      )}

      {dept === 'Finance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Invoices Authorized" value={opMetrics.approved_invoices?.length || 0} icon={Landmark} color="success" change="Payables" />
          <StatCard title="My Pending Claims" value={data.pending_requests?.length || 0} icon={ClipboardList} color="warning" change="Awaiting Manager" />
          <StatCard title="Pending Tasks" value={tasksPending} icon={CheckSquare} color="accent" change="Tasks" />
          <StatCard title="System Notifications" value={notificationsCount} icon={AlertTriangle} color="primary" change="Alerts" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold">{dept} Operational Ledger</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time checklist updates and log sheets.</p>
          </div>
          
          {dept === 'Inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-black text-muted-foreground uppercase">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Source Hub</th>
                    <th className="pb-3">Destination Hub</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {opMetrics.pending_movements?.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 font-bold">{m.product_name}</td>
                      <td className="py-3.5 text-muted-foreground">{m.source}</td>
                      <td className="py-3.5 text-muted-foreground">{m.destination}</td>
                      <td className="py-3.5 font-extrabold">{m.quantity}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          m.status === 'IN_TRANSIT' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(!opMetrics.pending_movements || opMetrics.pending_movements.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-muted-foreground">No pending movements.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {dept === 'Procurement' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-black text-muted-foreground uppercase">
                    <th className="pb-3">Supplier Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {opMetrics.suppliers?.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 font-bold">{s.name}</td>
                      <td className="py-3.5 text-muted-foreground">{s.contact || 'N/A'}</td>
                      <td className="py-3.5 font-extrabold text-warning">⭐ {s.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dept === 'Sales' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-black text-muted-foreground uppercase">
                    <th className="pb-3">Sale ID</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {opMetrics.recent_sales?.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 font-bold">#SL-{s.id}</td>
                      <td className="py-3.5 text-muted-foreground">{s.product_name}</td>
                      <td className="py-3.5 font-extrabold">{s.quantity} Units</td>
                      <td className="py-3.5 text-success font-black">₹{s.total_amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dept === 'Logistics' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-black text-muted-foreground uppercase">
                    <th className="pb-3">Fleet ID</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">From</th>
                    <th className="pb-3">To</th>
                    <th className="pb-3">Transit Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {opMetrics.active_shipments?.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 font-bold">#TR-{m.id}</td>
                      <td className="py-3.5 text-muted-foreground">{m.product_name}</td>
                      <td className="py-3.5 text-muted-foreground">{m.source}</td>
                      <td className="py-3.5 text-muted-foreground">{m.destination}</td>
                      <td className="py-3.5 font-black">{m.quantity}</td>
                    </tr>
                  ))}
                  {(!opMetrics.active_shipments || opMetrics.active_shipments.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-muted-foreground">No shipments in transit.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {dept === 'Finance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-black text-muted-foreground uppercase">
                    <th className="pb-3">Invoice ID</th>
                    <th className="pb-3">Supplier Vendor</th>
                    <th className="pb-3">Amount Payable</th>
                    <th className="pb-3">Authorized Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {opMetrics.approved_invoices?.map((i) => (
                    <tr key={i.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 font-bold">#INV-{i.id}</td>
                      <td className="py-3.5 text-muted-foreground">{i.supplier_name}</td>
                      <td className="py-3.5 font-black text-success">₹{i.total_amount?.toLocaleString()}</td>
                      <td className="py-3.5 font-black text-success uppercase">{i.status}</td>
                    </tr>
                  ))}
                  {(!opMetrics.approved_invoices || opMetrics.approved_invoices.length === 0) && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-muted-foreground">No approved invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-start">
          <h3 className="text-lg font-bold mb-1">Workstation Tasks</h3>
          <p className="text-xs text-muted-foreground mb-6">Review tasks and alerts.</p>
          
          <div className="space-y-3">
            <a href="/tasks" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
              Go to my checklist ({tasksPending}) <ArrowRight size={14} />
            </a>

            {dept === 'Inventory' && (
              <a href="/inventory" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                Go to stock ledger <ArrowRight size={14} />
              </a>
            )}

            {dept === 'Procurement' && (
              <a href="/suppliers" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                Go to supplier compliance <ArrowRight size={14} />
              </a>
            )}

            {dept === 'Sales' && (
              <a href="/sales" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                Go to sales desk <ArrowRight size={14} />
              </a>
            )}

            {dept === 'Logistics' && (
              <a href="/network-map" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                Inspect network map <ArrowRight size={14} />
              </a>
            )}

            {dept === 'Finance' && (
              <a href="/alerts" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                Check budget alerts <ArrowRight size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
