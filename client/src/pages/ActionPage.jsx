import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Clock, CheckCircle, User, ArrowRight } from 'lucide-react';

export default function ActionPage() {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending'); // 'Pending', 'Resolved'

    useEffect(() => {
        fetchSignals();
    }, []);

    const fetchSignals = async () => {
        try {
            // Fetch all signals (in prod, use params)
            const res = await axios.get('http://localhost:8000/signals');
            setSignals(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const filteredSignals = signals.filter(s =>
        filter === 'Pending' ? s.status !== 'Resolved' : s.status === 'Resolved'
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="bg-brand-600 text-white p-2 rounded-lg">
                        <User size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">DHO Dashboard</h1>
                        <p className="text-xs text-slate-500">District Surveillance Unit • North Zone</p>
                    </div>
                </div>

                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                    {['Pending', 'Resolved'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === f
                                    ? 'bg-white text-brand-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f} Actions
                        </button>
                    ))}
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-slate-400">Loading signals...</div>
                ) : filteredSignals.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                        <h3 className="text-lg font-medium text-slate-700">No {filter} Issues</h3>
                        <p className="text-slate-500">All clear in your jurisdiction.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredSignals.map(signal => (
                            <SignalCard key={signal.id} signal={signal} refresh={fetchSignals} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function SignalCard({ signal, refresh }) {
    const isHigh = signal.severity === 'High';

    // Calculate Time Left
    const deadline = new Date(signal.sla_deadline);
    const now = new Date();
    const hoursLeft = Math.floor((deadline - now) / (1000 * 60 * 60));
    const isOverdue = hoursLeft < 0;

    const handleAction = async (status, notes) => {
        try {
            await axios.post(`http://localhost:8000/signals/${signal.id}/action`, {
                status,
                notes
            });
            // Optimistic update or refresh
            refresh();
            alert("Action Logged");
        } catch (err) {
            alert("Error logging action");
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden flex flex-col md:flex-row ${isHigh ? 'border-red-500' : 'border-amber-400'
            }`}>
            {/* Status Column */}
            <div className={`p-4 w-full md:w-48 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100 ${isHigh ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isHigh ? 'text-red-600' : 'text-amber-600'
                    }`}>
                    {signal.severity} Priority
                </span>
                <div className={`text-3xl font-bold ${isHigh ? 'text-red-700' : 'text-amber-700'}`}>
                    {isOverdue ? "OVERDUE" : `${hoursLeft}h`}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                    <Clock size={12} />
                    <span>SLA Timer</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                            <span>{signal.signal_type}</span>
                            <span className="text-slate-400 font-normal text-sm mx-2">•</span>
                            <span className="text-slate-600 font-medium">{signal.syndrome}</span>
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {signal.explanation}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase">Assigned To</div>
                        <div className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-1">
                            {signal.assigned_to}
                        </div>
                    </div>
                </div>

                {/* Actions Area */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                        ID: #{signal.id} • Zone: {signal.zone ? signal.zone.name : `Zone ${signal.zone_id}`}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleAction('Investigating', 'DHO acknowledged signal.')}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                            Acknowledge
                        </button>
                        <button
                            onClick={() => handleAction('Resolved', 'Investigation complete. False alarm or contained.')}
                            className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors flex items-center space-x-2 shadow-lg shadow-slate-900/10"
                        >
                            <span>Resolve</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
