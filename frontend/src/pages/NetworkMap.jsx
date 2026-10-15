import React, { useEffect, useRef, useState } from 'react';
import { rebalancingAPI } from '../services/api';
import { Map, Loader2, Warehouse, Route, ArrowRight, CircleAlert, Settings } from 'lucide-react';
import TypewriterText from '../components/TypewriterText';

const NetworkMap = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef([]);
  const polylinesGroupRef = useRef([]);

  const [depots, setDepots] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    fetchData();
    // Check if Leaflet is loaded on window
    const checkLeaflet = setInterval(() => {
      if (window.L) {
        setLeafletLoaded(true);
        clearInterval(checkLeaflet);
      }
    }, 100);
    return () => clearInterval(checkLeaflet);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const depotsData = await rebalancingAPI.getDepots();
      setDepots(depotsData);
      const transfersData = await rebalancingAPI.getTransfers();
      setTransfers(transfersData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load map data', err);
      setLoading(false);
    }
  };

  // Initialize and update Map
  useEffect(() => {
    if (!leafletLoaded || loading || !depots.length) return;

    const L = window.L;

    // Initialize map if not already done
    if (!mapInstanceRef.current && mapContainerRef.current) {
      // Center of South India (Coimbatore/Salem region lat: 11.5, lon: 78.5)
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([11.8, 78.5], 7);

      // Load slick dark/light theme tiles based on modern designs
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
    }

    // Clear previous markers
    markersGroupRef.current.forEach(m => m.remove());
    markersGroupRef.current = [];
    polylinesGroupRef.current.forEach(p => p.remove());
    polylinesGroupRef.current = [];

    // Add Depot Markers
    depots.forEach(depot => {
      // Custom green marker icon
      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-[#10b981] border-2 border-white flex items-center justify-center text-white shadow-lg font-black text-xs">
              H
            </div>
            <div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full border-2 border-white animate-ping"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupContent = `
        <div class="p-3 text-card-foreground font-sans min-w-[200px]">
          <h4 class="font-bold text-sm text-foreground">${depot.name}</h4>
          <p class="text-[10px] text-muted-foreground uppercase font-black mb-2">${depot.state_name}</p>
          <div class="space-y-1 text-xs border-t border-border pt-1.5 mt-1">
            <p><b>Address:</b> ${depot.address || 'N/A'}</p>
            <p><b>Capacity:</b> ${depot.capacity.toLocaleString()} units</p>
            <p><b>Coordinates:</b> ${depot.latitude.toFixed(4)}, ${depot.longitude.toFixed(4)}</p>
          </div>
        </div>
      `;

      const marker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent);
        
      markersGroupRef.current.push(marker);
    });

    // Add Transfer Routes
    transfers.forEach(t => {
      const srcDepot = depots.find(d => d.id === t.source_depot_id);
      const destDepot = depots.find(d => d.id === t.destination_depot_id);
      
      if (srcDepot && destDepot) {
        const latlngs = [
          [srcDepot.latitude, srcDepot.longitude],
          [destDepot.latitude, destDepot.longitude]
        ];

        const isApproved = t.status === 'APPROVED';
        const color = isApproved ? '#10b981' : '#3b82f6'; // Green for approved, blue for pending rebalancing
        const weight = isApproved ? 4 : 3;
        const dashArray = isApproved ? null : '5, 8'; // Dashed for pending matching

        const popupContent = `
          <div class="p-3 font-sans min-w-[220px]">
            <h4 class="font-bold text-xs text-primary mb-1 uppercase tracking-wider">AI Route Optimization</h4>
            <div class="flex items-center gap-1.5 font-bold text-sm text-foreground mb-2">
              <span>${srcDepot.name}</span>
              <span class="text-muted-foreground">→</span>
              <span>${destDepot.name}</span>
            </div>
            <div class="space-y-1 text-xs border-t border-border pt-2">
              <p><b>Product:</b> ${t.product_name}</p>
              <p><b>Transfer Qty:</b> ${t.quantity.toLocaleString()} units</p>
              <p><b>Shipping Distance:</b> ${t.distance_km.toFixed(1)} KM</p>
              <p><b>Logistics Cost:</b> ₹${t.transport_cost.toLocaleString('en-IN')}</p>
              <p><b>Match Score:</b> <span class="font-black text-primary">${t.recommendation_score}%</span></p>
              <p><b>Status:</b> <span class="uppercase font-black text-[9px] px-1.5 py-0.5 rounded border ${isApproved ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}">${t.status}</span></p>
            </div>
          </div>
        `;

        const polyline = L.polyline(latlngs, {
          color,
          weight,
          dashArray,
          opacity: 0.85
        }).addTo(mapInstanceRef.current)
          .bindPopup(popupContent);

        polylinesGroupRef.current.push(polyline);
      }
    });

  }, [leafletLoaded, loading, depots, transfers]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">
            <TypewriterText text="Supply Chain Network Map" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Interactive operational command view displaying state territories, supply depots, and dynamic AI stock transfer paths.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-card border border-border rounded-3xl overflow-hidden shadow-sm h-[600px] relative">
          {(!leafletLoaded || loading) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card z-10">
              <Loader2 className="animate-spin text-primary" size={32} />
              <div className="text-muted-foreground font-semibold">Initializing command map...</div>
            </div>
          ) : null}
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        {/* Legend Panel */}
        <div className="bg-card p-6 border border-border rounded-3xl shadow-sm space-y-6 flex flex-col justify-start">
          <div>
            <h3 className="font-bold text-base text-foreground">Map Legend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Understand network routes and indicators.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#10b981] border-2 border-white flex items-center justify-center text-white font-bold text-[10px] shadow-md">
                H
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">Supply Depot / Hub</p>
                <p className="text-[10px] text-muted-foreground">Physical warehouse facility</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-1.5 w-10 bg-[#10b981] rounded"></div>
              <div className="text-xs">
                <p className="font-bold text-foreground">Approved Transfer Route</p>
                <p className="text-[10px] text-muted-foreground">Solid green connecting route</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-1.5 w-10 border-t-2 border-[#3b82f6] border-dashed"></div>
              <div className="text-xs">
                <p className="font-bold text-foreground">Pending Transfer Route</p>
                <p className="text-[10px] text-muted-foreground">Dashed blue connecting route</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 mt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Operational Depots</h4>
            <div className="space-y-2 overflow-y-auto max-h-[220px] no-scrollbar">
              {depots.map(d => (
                <div key={d.id} className="flex justify-between items-center p-2.5 bg-secondary/35 rounded-xl border border-border/50">
                  <div className="text-xs">
                    <p className="font-bold text-foreground truncate max-w-[120px]">{d.name}</p>
                    <span className="text-[9px] text-muted-foreground uppercase font-black">{d.state_name}</span>
                  </div>
                  <span className="text-[10px] font-black text-foreground bg-background px-2 py-0.5 rounded-lg border border-border">
                    {d.capacity.toLocaleString()} max
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkMap;
