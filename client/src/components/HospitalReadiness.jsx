import React from 'react';
import { Activity, Users, AlertTriangle, CheckCircle, Clock, Battery, Droplet, Wind, Pill, Bed, Thermometer } from 'lucide-react';

export default function HospitalReadiness({ caseReports }) {
    // 1. Calculate Summary Metrics
    const totalReports = caseReports.length;
    const pendingUploads = caseReports.filter(r => r.status === 'pending').length;

    // Aggregate Cases by Syndrome
    const syndromeCounts = caseReports.reduce((acc, report) => {
        const s = report.syndrome;
        acc[s] = (acc[s] || 0) + report.count;
        return acc;
    }, {});

    const topSyndrome = Object.entries(syndromeCounts).sort((a, b) => b[1] - a[1])[0];

    // 2. "The Logic" - Translator
    const feverCount = syndromeCounts['Fever'] || 0;
    const choleraCount = syndromeCounts['Cholera'] || 0;
    const respiratoryCount = syndromeCounts['Respiratory Issue'] || syndromeCounts['Respiratory'] || 0; // Handle partial matches

    // Static Mock Stock (Reference)
    const currentStock = {
        ivFluids: 50,      // Low to trigger easy alert
        isolationBeds: 15, // Low
        orsPacks: 100,     // High
        antibiotics: 50,
        o2Cylinders: 20,
        ventilators: 5
    };

    // Calculate Projected Demand
    const projections = {
        ivFluids: Math.ceil(feverCount * 2.5),
        isolationBeds: Math.ceil(feverCount * 0.1),
        orsPacks: choleraCount * 5,
        antibiotics: choleraCount * 1,
        o2Cylinders: Math.ceil(respiratoryCount * 0.5),
        ventilators: Math.ceil(respiratoryCount * 0.05)
    };

    // 3. Alerts Logic
    const activeAlerts = [];
    if (feverCount > 20) {
        activeAlerts.push({
            type: 'critical',
            title: 'Protocol Activation',
            message: 'Activate Fever Clinic Protocol (Cases > 20)',
            action: 'Mobilize nursing staff to Triage Zone A'
        });
    }
    if (choleraCount > 5) {
        activeAlerts.push({
            type: 'warning',
            title: 'Containment Required',
            message: 'Quarantine Ward Setup Required (Cholera > 5)',
            action: 'Isolate Ward 3'
        });
    }

    // Helper for Cards
    const ResourceCard = ({ label, icon: Icon, projected, stock, unit }) => {
        const isCritical = projected > stock;

        return (
            <div className={`p-5 rounded-xl border transition-all duration-300 ${isCritical
                    ? 'bg-red-50 border-red-200 shadow-lg shadow-red-100 animate-pulse-slow'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon size={20} />
                    </div>
                    {isCritical && (
                        <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full animate-pulse">
                            Shortage
                        </span>
                    )}
                </div>
                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</h4>
                <div className="flex items-baseline space-x-1">
                    <span className={`text-2xl font-black ${isCritical ? 'text-red-700' : 'text-slate-800'}`}>
                        {projected}
                    </span>
                    <span className="text-xs font-medium text-slate-400">needed</span>
                </div>

                {/* Progress / Comparison Bar */}
                <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>Stock: {stock}</span>
                        <span>{Math.round((projected / stock) * 100)}% Load</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((projected / stock) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6 pb-24">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Activity className="mr-3 text-red-600" />
                        Hospital Readiness
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time resource allocation engine.</p>
                </div>
                <div className="hidden md:flex items-center space-x-2 bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-slate-200">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>Live Impact Analysis</span>
                </div>
            </div>

            {/* Banner Alerts */}
            {activeAlerts.length > 0 && (
                <div className="space-y-4 mb-8">
                    {activeAlerts.map((alert, idx) => (
                        <div key={idx} className={`rounded-xl p-4 border-l-4 shadow-sm flex items-start ${alert.type === 'critical' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                            }`}>
                            <AlertTriangle className={`mr-4 flex-shrink-0 ${alert.type === 'critical' ? 'text-red-600' : 'text-amber-600'
                                }`} size={24} />
                            <div>
                                <h3 className={`font-bold text-lg ${alert.type === 'critical' ? 'text-red-900' : 'text-amber-900'
                                    }`}>{alert.title}: {alert.message}</h3>
                                <p className={`mt-1 text-sm font-medium ${alert.type === 'critical' ? 'text-red-700' : 'text-amber-700'
                                    }`}>Recommended Action: {alert.action}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Resource Demand Projections</h2>

            {/* Resource Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <ResourceCard
                    label="IV Fluids (Bags)"
                    icon={Droplet}
                    projected={projections.ivFluids}
                    stock={currentStock.ivFluids}
                />
                <ResourceCard
                    label="Isolation Beds"
                    icon={Bed}
                    projected={projections.isolationBeds}
                    stock={currentStock.isolationBeds}
                />
                <ResourceCard
                    label="ORS Packs"
                    icon={Pill}
                    projected={projections.orsPacks}
                    stock={currentStock.orsPacks}
                />
                <ResourceCard
                    label="Oxygen Cylinders"
                    icon={Wind}
                    projected={projections.o2Cylinders}
                    stock={currentStock.o2Cylinders}
                />
            </div>

            {/* Standard Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Total Reports Today</label>
                        <div className="text-2xl font-bold text-slate-900">{totalReports}</div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Users size={20} /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Pending Uploads</label>
                        <div className="text-2xl font-bold text-slate-900">{pendingUploads}</div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Clock size={20} /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Top Syndrome</label>
                        <div className="text-lg font-bold text-slate-900 truncate max-w-[120px]">
                            {topSyndrome ? topSyndrome[0] : "None"}
                        </div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Activity size={20} /></div>
                </div>
            </div>

        </div>
    );
}
