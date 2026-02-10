import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PRESETS = {
    1: [18.5314, 73.8446], // Aundh/Baner (North-West)
    2: [18.5000, 73.8500], // Swargate/South (South)
    3: [18.5600, 73.9100], // Viman Nagar (North-East)
    4: [18.4500, 73.8000], // Sinhagad (South-West)
    5: [18.5204, 73.9300], // Hadapsar (East)
};

// Robust hash-based color generator (same as ZoneMap)
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

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 12);
    }, [center, map]);
    return null;
}

export default function DiffusionMap({ frameData, zones, isFuture }) {
    // defaults
    const center = [18.5204, 73.8567];

    return (
        <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false} // Prevent accidental zooming while scrolling page
        >
            {/* Darker basemap for high contrast visualization */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* MapUpdater center={center} / */}

            {frameData.map((point) => {
                const zone = zones.find(z => z.id === point.zone_id);
                // Fallback location generator if not preset
                let lat = 18.52, lng = 73.85;
                if (PRESETS[point.zone_id]) {
                    [lat, lng] = PRESETS[point.zone_id];
                } else {
                    // Simple scatter for unknown zones
                    const latOffset = (((point.zone_id * 137) % 100) - 50) / 800;
                    const lngOffset = (((point.zone_id * 263) % 100) - 50) / 800;
                    lat += latOffset;
                    lng += lngOffset;
                }

                const color = getColorForDisease(point.disease);

                // Radius Logic
                const radius = Math.min(Math.max(point.value, 5), 40);

                return (
                    <CircleMarker
                        key={`${point.zone_id}-${point.disease}`}
                        center={[lat, lng]}
                        radius={radius}
                        pathOptions={{
                            color: isFuture ? color : color,
                            fillColor: color,
                            fillOpacity: isFuture ? 0.3 : 0.7, // Lower contrast for future
                            weight: isFuture ? 3 : 1, // Thicker border for future
                            dashArray: isFuture ? '6, 6' : null, // Distinct dashed line
                            className: isFuture ? 'pulsing-marker' : '' // Potential hook for CSS animation
                        }}
                    >
                        <Popup className="text-xs font-sans">
                            <div className="font-bold">{zone?.name || `Zone ${point.zone_id}`}</div>
                            <div className="text-slate-500">{point.disease}</div>
                            <div className="text-lg font-bold">{Math.round(point.value)} Cases</div>
                            {isFuture && <div className="text-indigo-600 font-bold text-[10px] uppercase">Predicted</div>}
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
