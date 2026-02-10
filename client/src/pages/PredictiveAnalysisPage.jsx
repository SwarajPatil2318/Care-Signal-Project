import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, TrendingUp, AlertTriangle, Activity, Map, Calendar } from 'lucide-react';
import ZoneMap from '../components/ZoneMap';
import ForecastChart from '../components/ForecastChart';

export default function PredictiveAnalysisPage({ onBack }) {
    const [summary, setSummary] = useState(null);
    const [zones, setZones] = useState([]);
    const [dominantForecasts, setDominantForecasts] = useState({});
    const [allForecasts, setAllForecasts] = useState([]);
    const [fullForecasts, setFullForecasts] = useState({});
    const [loading, setLoading] = useState(true);
    const [timeHorizon, setTimeHorizon] = useState(3); // 3 or 7 days

    const [selectedZoneId, setSelectedZoneId] = useState(null);
    const [selectedDisease, setSelectedDisease] = useState('ALL');

    // Extract unique diseases from data
    const availableDiseases = React.useMemo(() => {
        const set = new Set();
        allForecasts.forEach(f => set.add(f.disease));
        return Array.from(set).sort();
    }, [allForecasts]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async () => {
        try {
            const [sumRes, zoneRes] = await Promise.all([
                axios.get('http://localhost:8000/analysis/summary'),
                axios.get('http://localhost:8000/zones')
            ]);
            setSummary(sumRes.data);
            setZones(zoneRes.data);

            const domMap = {};
            const fullMap = {};
            const flatList = [];

            await Promise.all(zoneRes.data.map(async (z) => {
                const res = await axios.get(`http://localhost:8000/zones/${z.id}/forecast?days=7&include_history=true`);
                const forecasts = res.data;

                fullMap[z.id] = forecasts;

                if (forecasts.length > 0) {
                    const sorted = [...forecasts].sort((a, b) => b.intensity - a.intensity);
                    domMap[z.id] = { ...sorted[0], zone_id: z.id };
                    forecasts.forEach(f => flatList.push({ ...f, zone_id: z.id }));
                }
            }));

            setDominantForecasts(domMap);
            setAllForecasts(flatList);
            setFullForecasts(fullMap);
            setLoading(false);
        } catch (e) {
            console.error("Failed to load analysis data", e);
            setLoading(false);
        }
    };

    // Filter logic for Sidebar
    const sidebarContent = React.useMemo(() => {
        if (selectedDisease === 'ALL') {
            // Mode A: Zone Selection (Default)
            if (!selectedZoneId) return [];
            return allForecasts
                .filter(f => f.zone_id === selectedZoneId)
                .sort((a, b) => b.intensity - a.intensity);
        } else {
            // Mode B: Disease Overview (Show all zones with this disease)
            return allForecasts
                .filter(f => f.disease === selectedDisease)
                .sort((a, b) => b.intensity - a.intensity); // Highest risk first
        }
    }, [selectedDisease, selectedZoneId, allForecasts]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center">
                                <TrendingUp className="mr-2 text-indigo-600" />
                                Predictive Analysis
                            </h1>
                            <p className="text-xs text-slate-500">AI-driven disease forecasting & risk mapping</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Disease Selector */}
                        <div className="relative">
                            <select
                                value={selectedDisease}
                                onChange={(e) => {
                                    setSelectedDisease(e.target.value);
                                    setSelectedZoneId(null); // Reset zone selection when mode changes
                                }}
                                className="appearance-none bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="ALL">All Diseases</option>
                                {availableDiseases.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-600">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setTimeHorizon(3)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeHorizon === 3 ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                +3 Days
                            </button>
                            <button
                                onClick={() => setTimeHorizon(7)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeHorizon === 7 ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                +7 Days
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Section A: District Pulse */}
                {loading ? (
                    <div className="text-center py-20 text-slate-400">Running predictive models...</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-full">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{summary?.total_high_risk_zones || 0}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projected High Risk Zones</div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-900">{summary?.dominant_trend || "Stable"}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dominant Trend</div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-full">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-900">{summary?.reliability_score} Reliability</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Confidence</div>
                                </div>
                            </div>
                        </div>

                        {/* Section B: Spatiotemporal View */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                            {/* Forecast Map */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative flex flex-col">
                                <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-xs font-bold text-slate-600 border border-slate-200">
                                    Projected Risk Map (+{timeHorizon} Days)
                                </div>
                                {/* Map with Selection Handler */}
                                <div className="flex-1">
                                    <ZoneMap
                                        signals={[]}
                                        forecasts={fullForecasts}
                                        selectedDisease={selectedDisease}
                                        onSelectZone={(id) => {
                                            if (selectedDisease === 'ALL') setSelectedZoneId(id);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Aggregate Insight (Detailed List) */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {selectedDisease === 'ALL'
                                            ? (selectedZoneId ? "Zone Specific Forecasts" : "Select a Zone to View Details")
                                            : `High Risk Zones: ${selectedDisease}`}
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                    {sidebarContent.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                                            <Map size={32} className="mb-2 opacity-30" />
                                            <p>{selectedDisease === 'ALL' ? "Click a zone on map" : "No active alerts for this disease"}</p>
                                        </div>
                                    ) : (
                                        sidebarContent.map((f, idx) => {
                                            const zoneName = zones.find(z => z.id === f.zone_id)?.name || `Zone ${f.zone_id}`;
                                            const isHigh = f.risk_level === 'High';

                                            return (
                                                <div key={`${f.zone_id}-${f.disease}-${idx}`}
                                                    className={`p-4 rounded-xl border transition-all shadow-sm bg-white ${isHigh ? 'border-red-200' :
                                                        f.risk_level === 'Medium' ? 'border-amber-200' :
                                                            'border-slate-200'
                                                        }`}>

                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <h4 className="font-bold text-slate-800 text-sm mr-2">{zoneName}</h4>
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isHigh ? 'bg-red-100 text-red-700' :
                                                                    f.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-green-100 text-green-700'
                                                                    }`}>
                                                                    {f.risk_level}
                                                                </span>
                                                            </div>
                                                            {selectedDisease === 'ALL' && <div className="text-xs font-semibold text-indigo-600 mt-0.5">{f.disease}</div>}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-slate-800 leading-none">{Math.round(f.intensity * 100)}%</div>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-xs text-slate-500 mb-3 leading-dashed line-clamp-2" title={f.risk_reason}>
                                                        {f.risk_reason}
                                                    </p>

                                                    {/* Chart */}
                                                    <div className="h-28 w-full bg-slate-50 rounded-lg border border-slate-100 p-1 mb-3">
                                                        <ForecastChart
                                                            history={f.history}
                                                            forecast={f.forecast}
                                                        />
                                                    </div>

                                                    {/* Action Footer */}
                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                        <div className="flex items-center text-[10px] font-medium text-slate-400">
                                                            <TrendingUp size={12} className="mr-1" />
                                                            <span>{f.trend}</span>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">
                                                            Analyze &rarr;
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>




                        {/* Section C: Detailed Breakdown Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Zone</th>
                                        <th className="px-6 py-3">Disease</th>
                                        <th className="px-6 py-3">Predicted Risk</th>
                                        <th className="px-6 py-3">Confidence Interval (+{timeHorizon}d)</th>
                                        <th className="px-6 py-3">Trend Explanation</th>
                                        <th className="px-6 py-3">Rec. Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allForecasts
                                        .filter(f => selectedDisease === 'ALL' || f.disease === selectedDisease)
                                        .map((f, idx) => {
                                            const zoneName = zones.find(z => z.id === f.zone_id)?.name;
                                            const pred = f.forecast[timeHorizon - 1];
                                            return (
                                                <tr key={`${f.zone_id}-${f.disease}-${idx}`} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{zoneName}</td>
                                                    <td className="px-6 py-4 font-medium text-indigo-600">{f.disease}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${f.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                                                            f.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-green-100 text-green-700'
                                                            }`}>
                                                            {f.risk_level}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 font-mono">
                                                        {pred?.lower_bound} - {pred?.upper_bound}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {f.risk_reason || "Stable trend"}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-indigo-600">
                                                        {f.risk_level === 'High' ? 'DEPLOY CONTAINMENT' :
                                                            f.risk_level === 'Medium' ? 'INCREASE MONITORING' : 'ROUTINE'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div >
    );
}
