import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Play, Pause, Activity } from 'lucide-react';
import DiffusionMap from '../components/DiffusionMap';

export default function DiffusionPage({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState([]);
    const [timelineData, setTimelineData] = useState({}); // { "YYYY-MM-DD": [ { zone_id, value, type } ] }
    const [dates, setDates] = useState([]);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [speed, setSpeed] = useState(1000); // ms per frame

    // Filter State
    const [selectedDisease, setSelectedDisease] = useState('Cholera'); // Default
    const [availableDiseases, setAvailableDiseases] = useState([]);

    const playInterval = useRef(null);

    // 1. Data Fetching
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const zRes = await axios.get('http://localhost:8000/zones');
                setZones(zRes.data);

                // Fetch detail forecasts for ALL zones
                const allRes = await Promise.all(
                    zRes.data.map(async (z) => {
                        const res = await axios.get(`http://localhost:8000/zones/${z.id}/forecast?days=7&include_history=true`);
                        return { zone_id: z.id, data: res.data };
                    })
                );

                processData(allRes);
                setLoading(false);
            } catch (e) {
                console.error("Diffusion Load Failed", e);
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // 2. Data Processing (Pivot to Time-Series)
    const processData = (zoneDataList) => {
        const timeline = {};
        const diseaseSet = new Set();

        zoneDataList.forEach(({ zone_id, data }) => {
            // data is Array of DiseaseForecast objects
            data.forEach(diseaseForecast => {
                diseaseSet.add(diseaseForecast.disease);
                const disease = diseaseForecast.disease;

                // Process History
                diseaseForecast.history.forEach(pt => {
                    // Safe date parsing
                    const dateStr = pt.date ? pt.date.split('T')[0] : "UNKNOWN";
                    if (!timeline[dateStr]) timeline[dateStr] = [];
                    timeline[dateStr].push({
                        zone_id,
                        disease,
                        value: pt.value,
                        type: 'HISTORY'
                    });
                });

                // Process Forecast
                diseaseForecast.forecast.forEach(pt => {
                    const dateStr = pt.date ? pt.date.split('T')[0] : "UNKNOWN";
                    if (!timeline[dateStr]) timeline[dateStr] = [];

                    // Avoid dupes if history/forecast overlap on "Today"
                    // Prefer Actuals (History) if available
                    const existing = timeline[dateStr].find(e => e.zone_id === zone_id && e.disease === disease);
                    if (!existing) {
                        timeline[dateStr].push({
                            zone_id,
                            disease,
                            value: pt.value,
                            type: 'FORECAST'
                        });
                    }
                });
            });
        });

        // Sort Dates
        const sortedDates = Object.keys(timeline).sort();

        setTimelineData(timeline);
        setDates(sortedDates);

        const diseases = Array.from(diseaseSet).sort();
        setAvailableDiseases(diseases);

        // Auto-select a valid disease if current selection is invalid
        if (diseases.length > 0 && !diseases.includes(selectedDisease)) {
            setSelectedDisease(diseases[0]);
        }
    };

    // Smart Jump: When disease changes (or data loads), jump to first meaningful frame (non-zero value)
    useEffect(() => {
        if (dates.length === 0) return;

        // Find first index where this disease has > 0 cases
        const firstIndex = dates.findIndex(date => {
            const frame = timelineData[date] || [];
            const point = frame.find(p => p.disease === selectedDisease);
            return point && point.value > 0;
        });

        if (firstIndex !== -1) {
            setCurrentIndex(firstIndex);
        } else {
            // If no data found, try finding first index with ANY data for this disease (even 0)
            const fallbackIndex = dates.findIndex(date => {
                const frame = timelineData[date] || [];
                return frame.some(p => p.disease === selectedDisease);
            });
            setCurrentIndex(fallbackIndex !== -1 ? fallbackIndex : 0);
        }
    }, [selectedDisease, dates, timelineData]);

    // 3. Playback Logic
    useEffect(() => {
        if (isPlaying) {
            playInterval.current = setInterval(() => {
                setCurrentIndex(prev => {
                    if (prev >= dates.length - 1) {
                        setIsPlaying(false); // Stop at end
                        return prev;
                    }
                    return prev + 1;
                });
            }, speed);
        } else {
            clearInterval(playInterval.current);
        }
        return () => clearInterval(playInterval.current);
    }, [isPlaying, dates, speed]);

    // Derived: Current Frame
    const currentFrameData = useMemo(() => {
        if (dates.length === 0) return [];
        const dateKey = dates[currentIndex];
        const rawPoints = timelineData[dateKey] || [];

        // Filter by selected disease
        return rawPoints.filter(p => p.disease === selectedDisease);
    }, [currentIndex, dates, timelineData, selectedDisease]);

    const currentDate = dates[currentIndex];
    const isFuture = currentFrameData.some(p => p.type === 'FORECAST');
    const today = new Date().toISOString().split('T')[0];
    const isToday = currentDate === today;

    if (loading) return <div className="p-10 text-center text-slate-500">Loading spatial data...</div>;

    return (
        <div className="h-screen bg-slate-900 text-white font-sans flex flex-col overflow-hidden">

            {/* Top Bar */}
            <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 z-10 w-full shrink-0">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center">
                            <Activity className="mr-2 text-indigo-400" />
                            Disease Diffusion Playback
                        </h1>
                        <p className="text-xs text-slate-400">Visualizing spread dynamics over time</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    {/* Disease Selector */}
                    <div className="relative">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider absolute -top-2 left-2 bg-slate-900 px-1">Predicting</label>
                        <select
                            value={selectedDisease}
                            onChange={(e) => setSelectedDisease(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-indigo-300 text-sm font-bold py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[150px]"
                        >
                            {availableDiseases.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Display */}
                    <div className="text-right">
                        <div className={`text-2xl font-mono font-bold ${isFuture ? 'text-indigo-400' : 'text-emerald-400'}`}>
                            {currentDate || "Loading"}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-end items-center">
                            {isFuture ? "Forecast Model" : (isToday ? "Live Data" : "Historical Data")}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <div className="flex-1 relative w-full h-full">

                {/* 1. Map Layer */}
                <DiffusionMap
                    frameData={currentFrameData}
                    zones={zones}
                    isFuture={isFuture}
                />

                {/* 2. Debug Overlay - Fixed Z-Index */}
                <div className="absolute top-4 right-4 bg-black/80 p-4 rounded-lg text-xs font-mono text-green-400 pointer-events-none z-[9999] max-w-sm border border-green-900/50">
                    <div className="font-bold border-b border-green-900/50 mb-2 pb-1">DIAGNOSTICS</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-slate-500">Selected:</span> <span>{selectedDisease}</span>
                        <span className="text-slate-500">Date:</span> <span>{currentDate}</span>
                        <span className="text-slate-500">Points:</span> <span>{currentFrameData.length}</span>
                        <span className="text-slate-500">Zones:</span> <span>{zones.length}</span>
                    </div>
                    {currentFrameData.length > 0 && (
                        <div className="mt-2 text-slate-500 pt-2 border-t border-green-900/30">
                            First point: Zone {currentFrameData[0].zone_id} = {Math.round(currentFrameData[0].value)}
                        </div>
                    )}
                </div>

                {/* 3. Empty State Overlay - Fixed Z-Index */}
                {currentFrameData.length === 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999]">
                        <div className="bg-slate-900/80 backdrop-blur px-6 py-3 rounded-full border border-slate-700 text-slate-300 text-sm font-mono flex items-center shadow-xl">
                            <AlertIcon className="w-4 h-4 mr-2 text-indigo-400" />
                            No activity reported on {currentDate}
                        </div>
                    </div>
                )}

                {/* 4. Timeline Controls - Fixed Z-Index */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-6 z-[9999]">
                    <div className="bg-slate-800/90 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-2xl flex items-center space-x-6">

                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-transform transform active:scale-95"
                        >
                            {isPlaying ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
                        </button>

                        <div className="flex-1">
                            <input
                                type="range"
                                min="0"
                                max={Math.max(0, dates.length - 1)}
                                step="1"
                                value={currentIndex}
                                onChange={(e) => {
                                    setCurrentIndex(parseInt(e.target.value));
                                    setIsPlaying(false);
                                }}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                                <span>{dates[0]}</span>
                                <span>Today</span>
                                <span>{dates[dates.length - 1]}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSpeed(s => s === 1000 ? 500 : 1000)}
                            className={`p-2 rounded-lg text-xs font-bold ${speed === 500 ? 'text-indigo-400 bg-indigo-900/50' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            {speed === 500 ? '2x' : '1x'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AlertIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
