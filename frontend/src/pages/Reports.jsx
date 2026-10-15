import React, { useState } from 'react';
import { 
  BarChart3, FileSpreadsheet, FileText, Download, 
  Loader2, CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp, AlertTriangle, Play, HelpCircle
} from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const Reports = () => {
  const [downloading, setDownloading] = useState({});
  const [formats, setFormats] = useState({
    inventory: 'csv',
    sales: 'csv',
    utilization: 'csv',
    surplus: 'csv',
    deficit: 'csv',
    transfers: 'csv',
    production: 'csv',
    savings: 'csv'
  });

  const reportsList = [
    {
      key: 'inventory',
      endpoint: '/inventory',
      title: 'Inventory Ledger Report',
      description: 'Export complete warehouse listings including current stock levels, safety thresholds, category classifications, and asset valuations.',
      icon: <FileSpreadsheet className="text-blue-500" size={24} />,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      key: 'sales',
      endpoint: '/sales',
      title: 'Sales & Invoice Ledger',
      description: 'Export complete transaction logs detailing invoice numbers, product associations, quantities sold, unit prices, and revenue statistics.',
      icon: <FileText className="text-emerald-500" size={24} />,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      key: 'utilization',
      endpoint: '/inventory-utilization',
      title: 'Inventory Utilization Metrics',
      description: 'Export depot capacity utilization percentages, highlighting under-utilized hubs and potential storage optimization locations.',
      icon: <TrendingUp className="text-purple-500" size={24} />,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      key: 'surplus',
      endpoint: '/surplus-inventory',
      title: 'Surplus Stock Audit',
      description: 'Export inventory holdings that currently exceed reorder levels or are flagged as overstock, identifying rebalancing opportunities.',
      icon: <CheckCircle2 className="text-success" size={24} />,
      color: 'from-success to-emerald-500'
    },
    {
      key: 'deficit',
      endpoint: '/deficit-inventory',
      title: 'Critical Deficit Alerts Ledger',
      description: 'Export product shortage logs showing stock levels below safety margins, calling for urgent procurement or rebalancing.',
      icon: <AlertTriangle className="text-destructive" size={24} />,
      color: 'from-destructive to-rose-500'
    },
    {
      key: 'transfers',
      endpoint: '/transfer-recommendations',
      title: 'Rebalancing Transit Recommendations',
      description: 'Export rebalancing ledger history detailing source-destination depots, item counts, transit costs, and HOD approval states.',
      icon: <ArrowUpRight className="text-accent" size={24} />,
      color: 'from-accent to-emerald-500'
    },
    {
      key: 'production',
      endpoint: '/production-avoidance',
      title: 'Production Optimization Audits',
      description: 'Export records of avoided manufacturer overheads achieved by dynamically rebalancing surplus stock items.',
      icon: <Play className="text-amber-500" size={24} />,
      color: 'from-amber-500 to-warning'
    },
    {
      key: 'savings',
      endpoint: '/cost-savings',
      title: 'SmartChain AI Financial Savings',
      description: 'Export complete avoided cost ledgers comparing AI routing matrix costs directly with traditional manual logistical estimates.',
      icon: <TrendingUp className="text-cyan-500" size={24} />,
      color: 'from-cyan-500 to-blue-500'
    }
  ];

  const handleFormatChange = (key, format) => {
    setFormats(prev => ({ ...prev, [key]: format }));
  };

  const handleDownload = async (report) => {
    const format = formats[report.key];
    const key = report.key;
    const endpoint = `${report.endpoint}?format=${format}`;
    const fileExtension = format === 'excel' ? 'xlsx' : format;
    const filename = `${report.key}_report_${new Date().toISOString().slice(0,10)}.${fileExtension}`;

    try {
      setDownloading(prev => ({ ...prev, [key]: true }));
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/reports${endpoint}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download report. Please check if the backend is running.');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <BarChart3 className="text-primary" size={32} />
          <TypewriterText text="Enterprise Reports & Ledger Analytics" />
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          Export system-wide operational audits, rebalancing logs, product shortages, and cost optimization savings.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reportsList.map((report) => {
          const currentFormat = formats[report.key];
          const isDownloading = downloading[report.key];

          return (
            <div 
              key={report.key} 
              className="bg-card hover:shadow-xl transition-all duration-300 border border-border/80 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between"
            >
              {/* Gradient border top */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${report.color} opacity-80`} />
              
              <div>
                <div className="p-3 bg-secondary/60 w-fit rounded-2xl mb-4 border border-border/40">
                  {report.icon}
                </div>
                <h3 className="text-base font-extrabold text-foreground mb-1">{report.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  {report.description}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/40">
                {/* Format selection */}
                <div className="flex items-center justify-between p-2.5 bg-secondary/35 rounded-2xl border border-border/40">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Format Options:</span>
                  
                  <div className="flex bg-card border border-border/50 p-0.5 rounded-xl">
                    {['csv', 'excel', 'pdf'].map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => handleFormatChange(report.key, fmt)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          currentFormat === fmt 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={() => handleDownload(report)}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-secondary/70 text-foreground border border-border/80 font-bold text-xs rounded-2xl transition-all disabled:opacity-70"
                >
                  {isDownloading ? (
                    <Loader2 className="animate-spin text-primary" size={15} />
                  ) : (
                    <Download size={14} className="text-primary" />
                  )}
                  Export {report.title} ({currentFormat.toUpperCase()})
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Reports;
