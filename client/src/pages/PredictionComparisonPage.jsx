import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Activity, BrainCircuit } from 'lucide-react';
import ZoneMap from '../components/ZoneMap';

export default function PredictionComparisonPage({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [signals, setSignals] = useState([]);
    const [forecasts, setForecasts] = useState({});
    const [zones, setZones] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sigRes, zoneRes] = await Promise.all([
                    axios.get('http://localhost:8000/signals'),
                    axios.get('http://localhost:8000/zones')
                ]);

                // Current Signals
                setSignals(sigRes.data);
                setZones(zoneRes.data);

                // Fetch Forecasts
                const forecastMap = {};
                await Promise.all(zoneRes.data.map(async (zone) => {
                    try {
                        // Get 7-day forecast
                        const res = await axios.get(`http://localhost:8000/zones/${zone.id}/forecast?days=7`);
                        forecastMap[zone.id] = res.data;
                    } catch (e) {
                        // Default empty if fail
                        forecastMap[zone.id] = [];
                        console.error(`Failed to load forecast for zone ${zone.id}`, e);
                    }
                }));

                setForecasts(forecastMap);
                setLoading(false);
            } catch (e) {
                console.error("Comparison Data Load Failed", e);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-sans">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                    <div>Running Predictive Models...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors mr-4">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center">
                            <BrainCircuit className="mr-2 text-indigo-600" />
                            Risk Comparison Analysis
                        </h1>
                        <p className="text-xs text-slate-500">Real-time surveillance vs. AI forecasting model</p>
                    </div>
                </div>
            </header>

            {/* Split View Content */}
            <div className="flex-1 flex flex-col md:flex-row relative">

                {/* Left: Current Spread */}
                <div className="flex-1 flex flex-col md:border-r border-slate-200 relative h-1/2 md:h-full">
                    <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-md border border-slate-200">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Status</h2>
                        <div className="text-lg font-bold text-slate-900 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-emerald-500" />
                            Active Outbreaks
                        </div>
                    </div>

                    <ZoneMap signals={signals} forecasts={{}} />
                </div>

                {/* Right: AI Prediction */}
                <div className="flex-1 flex flex-col relative h-1/2 md:h-full bg-slate-50">
                    <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-md border border-indigo-200">
                        <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">AI Projection (+7 Days)</h2>
                        <div className="text-lg font-bold text-indigo-900 flex items-center">
                            <BrainCircuit className="w-5 h-5 mr-2 text-indigo-600" />
                            Predicted Hotspots
                        </div>
                    </div>

                    <ZoneMap signals={[]} forecasts={forecasts} />

                    {/* Prediction Legend overlay */}
                    <div className="absolute bottom-6 right-6 z-[400] max-w-xs bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-200 text-slate-600 text-xs shadow-xl hidden md:block">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center">
                            <BrainCircuit size={14} className="mr-2 text-indigo-600" />
                            AI Confidence Model
                        </h3>
                        <p className="leading-relaxed mb-3">
                            Predictive layer uses historical infection rates and spatial diffusion to estimate future hotspots.
                        </p>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-20 border border-indigo-600"></div>
                            <span className="font-bold text-indigo-900">Projected Spread Area</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
