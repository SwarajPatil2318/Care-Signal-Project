import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Hardcoded Hospital Locations (Demo)
// In a real app, this would come from the API (e.g. signal.hospital_location or a hospitals endpoint)
const HOSPITALS = [
    { id: 1, name: "District Hospital A", zone_id: 1, lat: 18.5254, lng: 73.8667 },
    { id: 2, name: "Community Health Center B", zone_id: 1, lat: 18.5450, lng: 73.8850 },
    { id: 3, name: "Primary Health Center C", zone_id: 2, lat: 18.5000, lng: 73.8500 },
    { id: 4, name: "Private Clinic D", zone_id: 2, lat: 18.4900, lng: 73.8700 },
];

const DISEASE_COLORS = {
    "Cholera": "#0ea5e9", // Sky Blue (Water)
    "Dengue": "#ef4444", // Red (Hemorrhagic)
    "Malaria": "#10b981", // Emerald (Environmental)
    "Fever": "#f59e0b", // Amber (General)
    "Respiratory Issue": "#8b5cf6", // Violet (Airborne)
    "Jaundice": "#eab308", // Yellow
    "Rash": "#ec4899", // Pink
    "Default": "#64748b" // Slate
};

// Robust hash-based color generator for unknown diseases
const getColorForDisease = (disease) => {
    if (!disease) return DISEASE_COLORS.Default;
    if (DISEASE_COLORS[disease]) return DISEASE_COLORS[disease];

    // Generate consistent color from string
    let hash = 0;
    for (let i = 0; i < disease.length; i++) {
        hash = disease.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to HSL for better visual distinction (High saturation/lightness)
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 50%)`;
};

export default function ZoneMap({ signals, forecasts, onSelectZone }) {

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
            <MapContainer
                center={[18.5204, 73.865]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                {/* Darker basemap for better contrast with "Glowing" markers */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                {/* Dynamic Markers based on Forecast Data (since IDs might have changed) */}
                {Object.keys(forecasts).map((zoneId, idx) => {
                    const zId = parseInt(zoneId);
                    const zoneForecasts = forecasts[zId] || [];

                    // Fallback locations for demo (distribute them in Pune)
                    // If we had real zone data with lat/lng, we'd use that.
                    // Cycling through a few fixed points to ensure they appear on map.
                    const LOCATIONS = [
                        { lat: 18.5254, lng: 73.8667, name: "North Ward" },
                        { lat: 18.5000, lng: 73.8500, name: "South Ward" },
                        { lat: 18.5600, lng: 73.8000, name: "West Zone" },
                        { lat: 18.5100, lng: 73.9100, name: "East Zone" }
                    ];

                    // Modulo to pick a location if we list more zones than locations
                    const loc = LOCATIONS[idx % LOCATIONS.length];
                    const activeSignals = signals.filter(s => s.zone_id === zId && s.status !== 'Resolved');

                    // Find Dominant Disease (Highest Intensity)
                    let dominant = null;
                    if (zoneForecasts.length > 0) {
                        dominant = [...zoneForecasts].sort((a, b) => b.intensity - a.intensity)[0];
                    }

                    // 1. Calculate Actuals Style
                    let actualColor = '#10b981';
                    let actualRadius = 6;
                    let actualStatus = "Normal";

                    if (activeSignals.some(s => s.severity === 'High')) {
                        actualColor = '#ef4444';
                        actualRadius = 10;
                        actualStatus = "Active Outbreak";
                    } else if (activeSignals.some(s => s.severity === 'Medium')) {
                        actualColor = '#f59e0b';
                        actualRadius = 8;
                        actualStatus = "Warning";
                    }

                    // 2. Calculate Forecast Overlay (based on DOMINANT disease)
                    let forecastRadius = 0;
                    let forecastColor = 'transparent';
                    let opacity = 0;

                    if (dominant && dominant.intensity > 0.05) { // Lower threshold
                        // Radius based on intensity (0-1)
                        // Max radius 1500m
                        forecastRadius = 300 + (dominant.intensity * 1200);
                        forecastColor = getColorForDisease(dominant.disease);
                        opacity = 0.2 + (dominant.intensity * 0.4); // 0.2 to 0.6 opacity
                    }

                    return (
                        <React.Fragment key={zId}>
                            {/* Forecast Overlay (Back) */}
                            {forecastRadius > 0 && (
                                <Circle
                                    center={[loc.lat, loc.lng]}
                                    radius={forecastRadius}
                                    pathOptions={{
                                        color: forecastColor,
                                        fillColor: forecastColor,
                                        fillOpacity: opacity,
                                        stroke: false
                                    }}
                                />
                            )}

                            {/* Actual Marker (Front) */}
                            <CircleMarker
                                center={[loc.lat, loc.lng]}
                                radius={actualRadius}
                                pathOptions={{
                                    color: '#ffffff',
                                    weight: 2,
                                    fillColor: actualColor,
                                    fillOpacity: 1
                                }}
                                eventHandlers={{
                                    click: () => onSelectZone && onSelectZone(zId, loc.name)
                                }}
                            >
                                <Tooltip sticky direction="top" className="min-w-[150px]">
                                    <div className="font-bold text-sm border-b pb-1 mb-1">Zone {zId}</div>
                                    <div className="text-[10px] text-slate-500 mb-2">
                                        Status: <span className="font-semibold">{actualStatus}</span>
                                    </div>

                                    {zoneForecasts.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase font-bold text-slate-400">Predicted Risks (7d)</div>
                                            {zoneForecasts.map((f, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-2 h-2 rounded-full mr-1.5"
                                                            style={{ backgroundColor: getColorForDisease(f.disease) }}
                                                        ></div>
                                                        <span className="font-medium text-slate-700">{f.disease}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-slate-500">{Math.round(f.intensity * 100)}%</span>
                                                        <span className={`font-bold ${f.risk_level === 'High' ? 'text-red-600' :
                                                            f.risk_level === 'Medium' ? 'text-amber-600' : 'text-green-600'
                                                            }`}>{f.risk_level}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Tooltip>
                            </CircleMarker>
                        </React.Fragment>
                    )
                })}
            </MapContainer>

            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-200 z-[400] text-xs">
                <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2">Disease Legend</h4>
                {Object.entries(DISEASE_COLORS).map(([disease, color]) => (
                    <div key={disease} className="flex items-center mb-1">
                        <div className="w-3 h-3 rounded-full mr-2 opacity-80" style={{ backgroundColor: color }}></div>
                        <span>{disease}</span>
                    </div>
                ))}
            </div>
        </div >
    );
}
