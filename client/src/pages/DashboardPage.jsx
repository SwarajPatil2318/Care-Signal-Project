import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, User, ArrowRight, BarChart2, Activity, Map, BrainCircuit } from 'lucide-react';
import SignalChart from '../components/SignalChart';
import ZoneMap from '../components/ZoneMap';

export default function DashboardPage({ onNavigate }) {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending'); // 'Pending', 'Resolved'
    const [showMap, setShowMap] = useState(false);
    const [zones, setZones] = useState({}); // { 1: "North", 2: "South" }
    const [forecasts, setForecasts] = useState({}); // { zoneId: { risk_level: 'High', ... } }

    useEffect(() => {
        fetchSignals();
    }, []);

    // Modal Wrapper
    const MapModal = () => {
        const [selectedZone, setSelectedZone] = useState(null);
        const [zoneName, setZoneName] = useState("");

        const handleZoneSelect = (zoneId, name) => {
            setSelectedZone(zoneId);
            setZoneName(name);
        };

        const zoneSignals = selectedZone
            ? signals.filter(s => s.zone_id === selectedZone && s.status !== 'Resolved')
            : [];

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

                    {/* Filtered List Side Panel */}
                    <div className={`w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-slate-50 transition-all ${selectedZone ? 'block' : 'hidden md:block'}`}>
                        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center">
                                <Map className="mr-2 text-indigo-600" size={20} />
                                {selectedZone ? zoneName : "District Map"}
                            </h2>
                            <button onClick={() => setShowMap(false)} className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {!selectedZone && (
                                <div className="text-center text-slate-400 mt-10">
                                    <p className="text-sm">Select a facility marker on the map to see active alerts.</p>
                                </div>
                            )}

                            {selectedZone && zoneSignals.length === 0 && (
                                <div className="text-center text-green-600 mt-10 bg-green-50 p-4 rounded-lg border border-green-100">
                                    <CheckCircle className="mx-auto mb-2" />
                                    <p className="font-bold text-sm">No Active Alerts</p>
                                    <p className="text-xs">This facility is operating normally.</p>
                                </div>
                            )}

                            {zoneSignals.map(signal => (
                                <div key={signal.id} className={`p-3 bg-white rounded-lg shadow-sm border-l-4 ${signal.severity === 'High' ? 'border-red-500' : 'border-amber-500'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase ${signal.severity === 'High' ? 'text-red-600' : 'text-amber-600'}`}>
                                            {signal.severity} Priority
                                        </span>
                                        <span className="text-xs text-slate-400">{new Date(signal.timestamp || signal.date).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{signal.syndrome} Spike</h4>
                                    <p className="text-xs text-slate-600 line-clamp-2">{signal.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative h-[50vh] md:h-auto">
                        <button
                            onClick={() => setShowMap(false)}
                            className="absolute top-4 right-4 z-[500] bg-white p-2 hover:bg-slate-100 rounded-full text-slate-800 shadow-md hidden md:block"
                        >
                            ✕
                        </button>
                        <ZoneMap signals={signals} forecasts={forecasts} onSelectZone={handleZoneSelect} />
                    </div>
                </div>
            </div>
        );
    };

    const fetchSignals = async () => {
        try {
            const [sigRes, zoneRes] = await Promise.all([
                axios.get('http://localhost:8000/signals'),
                axios.get('http://localhost:8000/zones')
            ]);

            setSignals(sigRes.data);

            const z = {};
            zoneRes.data.forEach(zone => {
                z[zone.id] = zone.name;
            });
            setZones(z);

            // Fetch Forecasts for each zone (MVP style)
            const forecastMap = {};
            // Use IDs from the zones endpoint, not just active signals
            const uniqueZoneIds = zoneRes.data.map(zone => zone.id);

            await Promise.all(uniqueZoneIds.map(async (zid) => {
                try {
                    const fres = await axios.get(`http://localhost:8000/zones/${zid}/forecast?days=3`);
                    forecastMap[zid] = fres.data;
                } catch (e) {
                    console.error("Forecast Error", e);
                }
            }));
            setForecasts(forecastMap);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const filteredSignals = signals.filter(s =>
        filter === 'Pending' ? s.status !== 'Resolved' : s.status === 'Resolved'
    );

    // Calculate Summary Stats
    const pendingHigh = signals.filter(s => s.status !== 'Resolved' && s.severity === 'High').length;
    const pendingTotal = signals.filter(s => s.status !== 'Resolved').length;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {showMap && <MapModal />}
            {/* Control Tower Header */}
            <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
                <div className="flex items-center space-x-4">
                    <div className="p-2 border border-slate-700 rounded-lg bg-slate-800">
                        <Activity size={20} className="text-brand-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">CareSignal Command Center</h1>
                        <p className="text-xs text-slate-400">District Surveillance Unit • Overview</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => setShowMap(true)}
                        className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Map size={16} />
                        <span>View Geospatial Map</span>
                    </button>

                    <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Active Alerts</div>
                        <div className={`text-xl font-bold ${pendingHigh > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {pendingHigh} Critical
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-300">Dr. Patil (DHO)</span>
                        <div className="bg-slate-700 p-2 rounded-full">
                            <User size={16} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Sidebar: Zone Status */}
                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                            <Map size={14} className="mr-2" /> Zone Details
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(zones).length === 0 ? (
                                <div className="text-sm text-slate-400">No active zones data.</div>
                            ) : Object.entries(zones).map(([id, name]) => {
                                const zoneSignals = signals.filter(s => s.zone_id === parseInt(id) && s.status !== 'Resolved');
                                const isClear = zoneSignals.length === 0;
                                const hasHigh = zoneSignals.some(s => s.severity === 'High');

                                return (
                                    <div key={id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <span className="text-sm font-medium">{name}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${isClear ? 'bg-green-100 text-green-700' :
                                            hasHigh ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {isClear ? 'Clear' : `${zoneSignals.length} Alerts`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Health</h3>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-slate-600">Sync Status</span>
                            <span className="text-green-600 font-medium">98% Online</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Last Report</span>
                            <span className="text-slate-900">14 mins ago</span>
                        </div>
                    </div>

                    {/* Upcoming Risks Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                            <Activity size={14} className="mr-2" /> Upcoming Risks (3 Days)
                        </h3>
                        <div className="space-y-3">
                            {Object.values(forecasts).filter(f => f.risk_level === 'High' || f.risk_level === 'Medium').length === 0 ? (
                                <div className="text-sm text-slate-400">No elevated risks predicted.</div>
                            ) : (
                                Object.values(forecasts)
                                    .filter(f => f.risk_level === 'High' || f.risk_level === 'Medium')
                                    .map(f => (
                                        <div key={f.zone_id} className={`p-3 rounded-lg border flex flex-col ${f.risk_level === 'High' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                                            }`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-bold text-slate-800">
                                                    {zones[f.zone_id] || `Zone ${f.zone_id}`}
                                                </span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${f.risk_level === 'High' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                                                    }`}>
                                                    {f.risk_level} Risk
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2">
                                                {f.risk_reason || "Elevated trend detected."}
                                            </p>
                                        </div>
                                    ))
                            )}
                        </div>
                        <button
                            onClick={() => onNavigate('analysis')}
                            className="mt-3 w-full py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center"
                        >
                            View Full Analysis <ArrowRight size={14} className="ml-1" />
                        </button>
                    </div>
                </aside>

                {/* Center: Signal Feed */}
                <main className="lg:col-span-3 space-y-6">
                    {/* Filters */}
                    <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
                        {['Pending', 'Resolved'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === f
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {f} ({signals.filter(s => f === 'Pending' ? s.status !== 'Resolved' : s.status === 'Resolved').length})
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-400">Loading signals...</div>
                    ) : filteredSignals.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                            <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                            <h3 className="text-lg font-medium text-slate-700">No {filter} Signals</h3>
                            <p className="text-slate-500">All clear in your jurisdiction.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {filteredSignals.map(signal => (
                                <SignalCard key={signal.id} signal={signal} forecast={forecasts[signal.zone_id]} refresh={fetchSignals} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

import InsightModal from '../components/InsightModal';

/* ... imports ... */

/* ... SignalCard component ... */
function SignalCard({ signal, forecast, refresh }) {
    const [expanded, setExpanded] = useState(false);
    const [breakdown, setBreakdown] = useState(null);
    const [showInsight, setShowInsight] = useState(false);
    const isHigh = signal.severity === 'High';

    // Calculate Time Left
    const deadline = new Date(signal.sla_deadline);
    const now = new Date();
    const hoursLeft = Math.floor((deadline - now) / (1000 * 60 * 60));
    const isOverdue = hoursLeft < 0;

    // Fetch Breakdown on Expand
    useEffect(() => {
        if (expanded && !breakdown) {
            axios.get(`http://localhost:8000/signals/${signal.id}/breakdown`)
                .then(res => setBreakdown(res.data))
                .catch(err => console.error(err));
        }
    }, [expanded, signal.id, breakdown]);

    const handleAction = async (status, notes) => {
        try {
            await axios.post(`http://localhost:8000/signals/${signal.id}/action`, { status, notes });
            refresh();
        } catch (err) { alert("Error logging action"); }
    };

    return (
        <>
            <InsightModal isOpen={showInsight} onClose={() => setShowInsight(false)} signal={signal} />
            <div className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden transition-all duration-300 flex flex-col ${signal.status === 'Resolved' ? 'border-green-500' :
                isHigh ? 'border-red-500' : 'border-amber-400'
                } ${expanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>

                <div className="flex flex-col md:flex-row">
                    {/* SLA Status Sidebar */}
                    <div className={`p-4 w-full md:w-32 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100 ${signal.status === 'Resolved' ? 'bg-green-50/50' :
                        isHigh ? 'bg-red-50/50' : 'bg-amber-50/50'
                        }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${signal.status === 'Resolved' ? 'text-green-600' :
                            isHigh ? 'text-red-600' : 'text-amber-600'
                            }`}>
                            {signal.status === 'Resolved' ? 'Status' : `${signal.severity} Priority`}
                        </span>
                        <div className={`text-xl font-bold ${signal.status === 'Resolved' ? 'text-green-700' :
                            isHigh ? 'text-red-700' : 'text-amber-700'
                            }`}>
                            {signal.status === 'Resolved' ? "DONE" : (isOverdue ? "LATE" : `${hoursLeft}h`)}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-5 flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wide">
                                        {signal.signal_type}
                                    </span>
                                    <span className="text-slate-400 text-xs">•</span>
                                    <span className="text-xs text-slate-500 font-medium">
                                        {new Date(signal.date).toDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 flex items-center">
                                    {signal.syndrome} Spike
                                    {expanded ? null : (
                                        <span
                                            className="text-sm font-normal text-indigo-500 ml-2 hover:text-indigo-700 hover:underline cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowInsight(true);
                                            }}
                                        >
                                            (Click to see why)
                                        </span>
                                    )}
                                </h3>

                                {/* Default explanation (hidden when expanded to avoid dup) */}
                                {!expanded && (
                                    <p className="text-slate-600 text-sm mt-2 leading-relaxed max-w-2xl line-clamp-1">
                                        {signal.explanation}
                                    </p>
                                )}
                            </div>

                            {/* Assignment Badge & Risk Tag */}
                            <div className="text-right hidden sm:block">
                                <div className="flex flex-col items-end space-y-1">
                                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-xs font-bold text-indigo-900">{signal.assigned_to}</span>
                                    </div>
                                    {forecast && forecast.risk_level === 'High' && (
                                        <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200 uppercase">
                                            <span>⚠️ Predicted High Risk</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Expanded Section: Chart & Actions */}
                        {expanded && (
                            <div className="mt-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300 cursor-auto" onClick={(e) => e.stopPropagation()}>

                                {/* Explainability Section */}
                                <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                        <Activity size={14} className="mr-1" /> Why was this triggered?
                                    </h4>
                                    {breakdown ? (
                                        <div>
                                            <p className="text-sm text-slate-800 font-medium leading-relaxed mb-3">
                                                {breakdown.summary}
                                            </p>
                                            <div className="space-y-2">
                                                {breakdown.breakdown.map((b, i) => (
                                                    <div key={i} className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-600">{b.hospital}</span>
                                                        <div className="flex items-center space-x-2 w-1/2">
                                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500" style={{ width: `${(b.count / signal.value) * 100}%` }}></div>
                                                            </div>
                                                            <span className="text-slate-900 font-bold w-6 text-right">{b.count}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                className="mt-4 text-xs font-bold text-indigo-600 hover:underline flex items-center"
                                                onClick={() => setShowInsight(true)}
                                            >
                                                <BrainCircuit size={12} className="mr-1" />
                                                View Detailed AI Report
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400">Analyzing factors...</div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Review Data (Chart) */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                                            <BarChart2 size={14} className="mr-1" /> 14-Day Trend
                                        </h4>
                                        <SignalChart signalId={signal.id} baseline={signal.baseline} />
                                    </div>

                                    {/* Take Action */}
                                    <div className="flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                                                Recommended Response
                                            </h4>
                                            <div className="p-3 bg-indigo-50 text-indigo-800 text-sm rounded-lg border border-indigo-100 mb-4">
                                                Check nearby facility reports. Deploy {signal.assigned_to} to investigate {signal.syndrome} cluster in {signal.zone?.name}.
                                            </div>
                                        </div>

                                        <div className="flex space-x-3 justify-end mt-4">
                                            <button
                                                onClick={() => handleAction('Investigating', 'Ack')}
                                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Log Investigation
                                            </button>
                                            <button
                                                onClick={() => handleAction('Resolved', 'Closed')}
                                                className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-lg shadow-slate-900/10 flex items-center space-x-2"
                                            >
                                                <span>Close Alert</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
