import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, UserCog, Plus, 
  Search, MoreVertical, Edit2, Trash2, 
  LayoutGrid, List as ListIcon 
} from 'lucide-react';
import axios from 'axios';
import TypewriterText from '../components/TypewriterText';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/api/v1/departments/');
            setDepartments(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setLoading(false);
        }
    };

    const filteredDepts = departments.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <TypewriterText text="Departments" />
          </h1>
          <p className="text-muted-foreground font-medium">Manage organizational units and leadership.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
          <Plus size={20} /> Create Department
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search departments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-border focus:ring-2 focus:ring-primary/10 outline-none transition-all"
          />
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredDepts.map((dept) => (
            <div key={dept.id} className={`bg-card group hover:shadow-xl transition-all duration-300 border border-border ${viewMode === 'grid' ? 'p-6 rounded-3xl flex flex-col' : 'px-6 py-4 rounded-2xl flex items-center justify-between'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">EST. {new Date(dept.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {viewMode === 'grid' && (
                <>
                  <p className="text-sm text-muted-foreground mt-4 line-clamp-2 min-h-[40px]">
                    {dept.description || 'No description provided for this department.'}
                  </p>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-2">
                            <UserCog size={16} className="text-primary" />
                            <span className="text-xs font-bold">HOD</span>
                        </div>
                        <span className="text-xs font-medium">{dept.hod_id ? `UserID: ${dept.hod_id}` : 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-accent" />
                            <span className="text-xs font-bold">Staff</span>
                        </div>
                        <span className="text-xs font-medium">Active Units</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-6 flex gap-2">
                    <button className="flex-1 py-2 rounded-xl bg-secondary hover:bg-secondary/70 text-xs font-bold transition-colors">Manage Staff</button>
                    <button className="p-2 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                  </div>
                </>
              )}

              {viewMode === 'list' && (
                <div className="flex items-center gap-8">
                    <div className="hidden lg:flex items-center gap-2">
                        <UserCog size={16} className="text-muted-foreground" />
                        <span className="text-xs font-bold">{dept.hod_id ? 'Assign HOD' : 'Unassigned'}</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-secondary transition-colors"><Edit2 size={16} /></button>
                        <button className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={16} /></button>
                    </div>
                </div>
              )}
            </div>
          ))}
          {filteredDepts.length === 0 && (
            <div className="col-span-full py-20 text-center bg-card rounded-3xl border-2 border-dashed border-border">
                <Building2 size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold">No departments found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or create a new unit.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Departments;
