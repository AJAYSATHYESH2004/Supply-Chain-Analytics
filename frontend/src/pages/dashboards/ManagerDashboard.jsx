import React, { useState, useEffect } from 'react';
import { 
  Warehouse, Boxes, Truck, AlertTriangle, ArrowRight, Loader2, ClipboardList, Activity,
  DollarSign, ShoppingCart, Star, Sparkles, TrendingUp, Landmark, UserCheck, Package
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

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // WebSocket hook for dashboard real-time updates
  useWebSocket('/ws/dashboard', (msg) => {
    if (msg.event === 'refresh_dashboard') {
      fetchStats();
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getManagerData();
      setData(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-muted-foreground font-medium">Loading department dashboards...</div>
      </div>
    );
  }

  const dept = data?.department_name || 'Inventory';
  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text={`${dept} Dashboard`} />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {dept === 'Inventory' && "Monitor stock levels, track physical audits, and manage inter-depot rebalancing movements."}
            {dept === 'Procurement' && "Approve purchase requests, review supplier compliance ratings, and track supply orders."}
            {dept === 'Sales' && "Track sales metrics, evaluate forecasted demand levels, and analyze top-selling products."}
            {dept === 'Logistics' && "Coordinate vehicle transfer fleets, manage active routes, and track shipment delivery timelines."}
            {dept === 'Finance' && "Review budget usage summaries, calculate inter-depot savings ROI, and authorize payables."}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-xs font-bold border border-border">
            <Activity size={14} className="text-success" />
            DEPARTMENT: {dept.toUpperCase()} MANAGER
          </div>
        </div>
      </div>

      {/* ─── RENDER CARDS BY DEPARTMENT ─── */}
      {dept === 'Inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Inventory Stock" value={metrics.inventory_available} icon={Boxes} color="success" change="Available" />
          <StatCard title="Low Stock Products" value={metrics.low_stock_products} icon={AlertTriangle} color="warning" change="Critically Low" />
          <StatCard title="Surplus Units Available" value={metrics.surplus_units} icon={Sparkles} color="accent" change="Transferable" />
          <StatCard title="Deficit Units Needed" value={metrics.deficit_units} icon={Warehouse} color="primary" change="Reorder Alert" />
        </div>
      )}

      {dept === 'Procurement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Pending Purchase Requests" value={metrics.pending_requests_count} icon={ClipboardList} color="warning" change="Awaiting Action" />
          <StatCard title="Supplier Success Rate" value={metrics.supplier_performance_rate} icon={Star} color="accent" change="Average" />
          <StatCard title="Procurement Costs" value={`₹${metrics.procurement_costs?.toLocaleString()}`} icon={DollarSign} color="primary" change="YTD Expenditure" />
          <StatCard title="Active Suppliers" value={data.total_products || 5} icon={Truck} color="success" change="Operational" />
        </div>
      )}

      {dept === 'Sales' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Sales Revenue" value={`₹${metrics.sales_revenue?.toLocaleString()}`} icon={DollarSign} color="success" change="YTD Revenue" />
          <StatCard title="Orders Processed" value={metrics.orders_processed} icon={ShoppingCart} color="accent" change="Delivered" />
          <StatCard title="Top Product" value={metrics.top_products?.[0]?.name ? (metrics.top_products[0].name.length > 18 ? metrics.top_products[0].name.substring(0, 18) + '...' : metrics.top_products[0].name) : "N/A"} icon={Sparkles} color="warning" change="Best Seller" />
          <StatCard title="Best Seller Units" value={`${metrics.top_products?.[0]?.units_sold || 0} Units`} icon={TrendingUp} color="primary" change="Volume" />
        </div>
      )}

      {dept === 'Logistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Transfers" value={metrics.active_transfers_count} icon={Truck} color="accent" change="In Transit" />
          <StatCard title="Delayed Shipments" value={metrics.delayed_shipments} icon={AlertTriangle} color="warning" change="Requires Check" />
          <StatCard title="Delivery Success" value={metrics.delivery_success_rate} icon={UserCheck} color="success" change="Average Rate" />
          <StatCard title="Route Efficiency" value={metrics.route_efficiency} icon={TrendingUp} color="primary" change="AI Optimised" />
        </div>
      )}

      {dept === 'Finance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Cost Savings" value={`₹${metrics.total_cost_savings?.toLocaleString()}`} icon={Sparkles} color="success" change="Rebalance Savings" />
          <StatCard title="Transfer Cost" value={`₹${metrics.transfer_costs?.toLocaleString()}`} icon={Landmark} color="accent" change="Expenditure" />
          <StatCard title="Procurement Cost" value={`₹${metrics.procurement_costs?.toLocaleString()}`} icon={DollarSign} color="primary" change="Expenditure" />
          <StatCard title="AI Rebalancing ROI" value={metrics.roi_metrics} icon={TrendingUp} color="warning" change="Savings Index" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── DETAILS TABLES / GRAPHS ─── */}
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold">{dept} Operational Ledger</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time status updates and department transactions.</p>
          </div>

          {dept === 'Inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-black text-muted-foreground uppercase">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Source Hub</th>
                    <th className="pb-3">Destination Hub</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {metrics.recent_stock_movements?.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 font-bold">{m.product_name}</td>
                      <td className="py-3.5 text-muted-foreground">{m.source}</td>
                      <td className="py-3.5 text-muted-foreground">{m.destination}</td>
                      <td className="py-3.5 font-extrabold">{m.quantity}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          m.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(!metrics.recent_stock_movements || metrics.recent_stock_movements.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-muted-foreground">No recent stock movements.</td>
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
                    <th className="pb-3">PO ID</th>
                    <th className="pb-3">Supplier</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {metrics.purchase_orders_list?.map((po) => (
                    <tr key={po.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 font-bold">#PO-{po.id}</td>
                      <td className="py-3.5 text-muted-foreground">{po.supplier_name}</td>
                      <td className="py-3.5 font-extrabold">₹{po.total_amount?.toLocaleString()}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          po.status === 'DELIVERED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>{po.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(!metrics.purchase_orders_list || metrics.purchase_orders_list.length === 0) && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-muted-foreground">No purchase orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {dept === 'Sales' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs font-black text-muted-foreground uppercase">
                      <th className="pb-3">Product Name</th>
                      <th className="pb-3">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-semibold">
                    {metrics.top_products?.map((tp, idx) => (
                      <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3.5 font-bold">{tp.name}</td>
                        <td className="py-3.5 font-extrabold text-success">{tp.units_sold} Units</td>
                      </tr>
                    ))}
                    {(!metrics.top_products || metrics.top_products.length === 0) && (
                      <tr>
                        <td colSpan="2" className="py-8 text-center text-muted-foreground">No sales orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dept === 'Logistics' && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Active Inter-Depot Transit Cost Savings:</p>
              <h4 className="text-xl font-black text-foreground mt-2">₹{metrics.transport_costs?.toLocaleString()} Total Costs incurred.</h4>
              <p className="text-xs text-muted-foreground mt-1">Inter-depot stock rebalancing runs at 91.5% routing efficiency compared to external vendor routes.</p>
              <div className="mt-6 p-4 bg-secondary/35 border border-border/50 rounded-2xl">
                <h4 className="text-xs font-bold text-foreground mb-1">Fleet Operations Note:</h4>
                <p className="text-[11px] text-muted-foreground">All rebalancing vehicles are tracking live. Delayed shipments have flagged alerts for immediate hub manager check-in.</p>
              </div>
            </div>
          )}

          {dept === 'Finance' && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                  <span>Rebalancing Budget Spent</span>
                  <span>₹{metrics.budget_usage?.used?.toLocaleString()} / ₹{metrics.budget_usage?.allocated?.toLocaleString()}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(((metrics.budget_usage?.used || 0) / (metrics.budget_usage?.allocated || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Budget allocated includes both approved inter-depot transport expenses and purchase order supplier payables.</p>
            </div>
          )}
        </div>

        {/* ─── ACTION ITEMS SIDEBAR ─── */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-start">
          <h3 className="text-lg font-bold mb-1">Workflow Actions</h3>
          <p className="text-xs text-muted-foreground mb-6">Access task dashboards and active requests.</p>
          
          <div className="space-y-3">
            <a href="/tasks" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
              View assigned tasks ({data.pending_tasks?.length || 0}) <ArrowRight size={14} />
            </a>

            {dept === 'Inventory' && (
              <>
                <a href="/inventory" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  Update inventory logs <ArrowRight size={14} />
                </a>
                <a href="/rebalancing" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  View rebalancing panel <ArrowRight size={14} />
                </a>
              </>
            )}

            {dept === 'Procurement' && (
              <>
                <a href="/suppliers" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  Manage active suppliers <ArrowRight size={14} />
                </a>
                <a href="/approvals" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  Execute PO approvals ({metrics.pending_requests_count || 0}) <ArrowRight size={14} />
                </a>
              </>
            )}

            {dept === 'Sales' && (
              <>
                <a href="/sales" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  View sales orders ledger <ArrowRight size={14} />
                </a>
                <a href="/forecasting" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  Analyze demand forecasts <ArrowRight size={14} />
                </a>
              </>
            )}

            {dept === 'Logistics' && (
              <>
                <a href="/network-map" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  Inspect network routes map <ArrowRight size={14} />
                </a>
                <a href="/transfer-recommendations" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  Approve transfers <ArrowRight size={14} />
                </a>
              </>
            )}

            {dept === 'Finance' && (
              <>
                <a href="/reports" className="w-full flex items-center justify-between p-3.5 bg-secondary/25 border border-border/40 rounded-2xl hover:bg-secondary/40 transition-colors font-bold text-xs text-foreground">
                  Review savings analytics <ArrowRight size={14} />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
