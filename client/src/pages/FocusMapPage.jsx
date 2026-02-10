import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { ArrowLeft, Layers, Calendar, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- Constants & Helpers ---
const PRESETS = {
    1: [18.5314, 73.8446], // Aundh/Baner (North-West)
    2: [18.5000, 73.8500], // Swargate/South (South)
    3: [18.5600, 73.9100], // Viman Nagar (North-East)
    4: [18.4500, 73.8000], // Sinhagad (South-West)
    5: [18.5204, 73.9300], // Hadapsar (East)
};

const getColorForDisease = (disease) => {
    if (!disease) return "#64748b";

    // Standard Colors
    const KNOWN_COLORS = {
        "Cholera": "#0ea5e9", // Sky Blue
        "Dengue": "#ef4444", // Red
        "Malaria": "#10b981", // Emerald
        "Fever": "#f59e0b", // Amber
        "Respiratory Issue": "#8b5cf6", // Violet
        "Jaundice": "#eab308", // Yellow
        "Rash": "#ec4899", // Pink
    };

    if (KNOWN_COLORS[disease]) return KNOWN_COLORS[disease];

    // Fallback Hash
    let hash = 0;
    for (let i = 0; i < disease.length; i++) {
        hash = disease.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 50%)`;
};

export default function FocusMapPage({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState([]);
    const [allForecasts, setAllForecasts] = useState({}); // { zone_id: [DiseaseForecast] }

    // UI State
    const [selectedDisease, setSelectedDisease] = useState('Cholera');
    const [horizon, setHorizon] = useState(3); // 3 or 7
    const [availableDiseases, setAvailableDiseases] = useState([]);

    // 1. Fetch Data
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const zRes = await axios.get('http://localhost:8000/zones');
                setZones(zRes.data);

                const forecastsMap = {};
                const diseaseSet = new Set();

                await Promise.all(
                    zRes.data.map(async (z) => {
                        const res = await axios.get(`http://localhost:8000/zones/${z.id}/forecast?days=7`);
                        forecastsMap[z.id] = res.data;
                        res.data.forEach(f => diseaseSet.add(f.disease));
                    })
                );

                setAllForecasts(forecastsMap);
                setAvailableDiseases(Array.from(diseaseSet).sort());
                setLoading(false);
            } catch (e) {
                console.error("Focus Map Load Failed", e);
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // 2. Compute Map Metrics
    const mapPoints = useMemo(() => {
        const points = [];
        zones.forEach(zone => {
            const forecasts = allForecasts[zone.id] || [];
            const target = forecasts.find(f => f.disease === selectedDisease);

            if (target) {
                // Get forecasted value at the horizon index
                // horizon 3 -> index 2, horizon 7 -> index 6
                // Forecast array is 0-indexed starting Tomorrow
                const forecastDayIndex = Math.min(horizon - 1, target.forecast.length - 1);
                const forecastPoint = target.forecast[forecastDayIndex];

                if (forecastPoint) {
                    points.push({
                        zone_id: zone.id,
                        zone_name: zone.name,
                        value: forecastPoint.value,
                        intensity: target.intensity, // Normalized 0-1 from backend
                        risk_level: target.risk_level
                    });
                }
            }
        });
        return points;
    }, [allForecasts, selectedDisease, horizon, zones]);

    // 3. Render
    if (loading) return <div className="p-10 text-center text-slate-500">Initializing spatial engine...</div>;

    const baseColor = getColorForDisease(selectedDisease);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center text-slate-800">
                            <Layers className="mr-2 text-indigo-600" />
                            Disease Focus Map
                        </h1>
                        <p className="text-xs text-slate-500">High-fidelity spatial risk analysis</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Disease Selector */}
                    <select
                        value={selectedDisease}
                        onChange={(e) => setSelectedDisease(e.target.value)}
                        className="bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {availableDiseases.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    {/* Horizon Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setHorizon(3)}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${horizon === 3 ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            +3 Days
                        </button>
                        <button
                            onClick={() => setHorizon(7)}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${horizon === 7 ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            +7 Days
                        </button>
                    </div>
                </div>
            </header>

            {/* Map Area */}
            <div className="flex-1 relative">
                <MapContainer
                    center={[18.5204, 73.8567]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Clean light map
                        attribution='&copy; CARTO'
                    />

                    {mapPoints.map(p => {
                        let lat = 18.52, lng = 73.85;
                        if (PRESETS[p.zone_id]) {
                            [lat, lng] = PRESETS[p.zone_id];
                        } else {
                            const latOffset = (((p.zone_id * 137) % 100) - 50) / 800;
                            const lngOffset = (((p.zone_id * 263) % 100) - 50) / 800;
                            lat += latOffset;
                            lng += lngOffset;
                        }

                        // Visualization Rules
                        // Radius: Base 10 + Value/2 (Clamped 10-60)
                        const radius = Math.min(Math.max(10 + (p.value), 10), 80);

                        // Opacity: Stronger for higher intensity
                        const opacity = 0.4 + (p.intensity * 0.6);

                        return (
                            <CircleMarker
                                key={`${p.zone_id}-${selectedDisease}`}
                                center={[lat, lng]}
                                radius={radius}
                                pathOptions={{
                                    color: baseColor,
                                    fillColor: baseColor,
                                    fillOpacity: opacity,
                                    weight: 1, // Thin border
                                    opacity: 0.8
                                }}
                            >
                                <Popup className="text-xs font-sans">
                                    <div className="font-bold text-slate-800">{p.zone_name}</div>
                                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                                        {selectedDisease} Forecast (+{horizon}d)
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
                                        {Math.round(p.value)} <span className="text-xs font-normal text-slate-500">cases</span>
                                    </div>
                                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${p.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                                        p.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {p.risk_level} Risk
                                    </div>
                                </Popup>
                            </CircleMarker>
                        )
                    })}

                </MapContainer>

                {/* Legend Overlay */}
                <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-200 shadow-xl max-w-xs">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Map Legend</h3>

                    <div className="flex items-center mb-2">
                        <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: baseColor, opacity: 0.8 }}></div>
                        <span className="text-sm font-bold text-slate-700">{selectedDisease} Presence</span>
                    </div>

                    <div className="space-y-2 mt-4">
                        <div className="flex items-center text-xs text-slate-500">
                            <div className="w-8 h-8 rounded-full border border-slate-300 mr-3 flex items-center justify-center bg-slate-100"></div>
                            <span>Circle Size = Future Case Count</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: baseColor, opacity: 1 }}></div>
                            <span>Opacity = Intensity Score</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
