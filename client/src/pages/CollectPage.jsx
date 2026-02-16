import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Wifi, WifiOff, Save, RefreshCw, Calendar, Check, AlertCircle, Activity } from 'lucide-react';
import axios from 'axios';

const SYNDROMES = [
    "Fever", "Respiratory Issue", "Diarrhea", "Jaundice", "Rash", "Neurological", "Cholera"
];

const AGE_GROUPS_DEFAULTS = "16-50"; // Simplifying for MVP Desktop (Assuming Aggregates)
// If backend needs age breakdown, we'd need a matrix (Syndrome x Age). 
// For now, we will submit all as "Unknown" or "16-50"/Adult unless user specifies, 
// to keep the "Numeric Input" requirement simple.

// Hardcoded match with server/seed.py
const HOSPITALS = [
    { id: 1, name: "District Hospital A" },
    { id: 2, name: "Community Health Center B" },
    { id: 3, name: "Primary Health Center C" },
    { id: 4, name: "Private Clinic D" }
];

export default function CollectPage({ onReportSubmitted }) {
    // State
    const [selectedHospitalId, setSelectedHospitalId] = useState(1);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [grid, setGrid] = useState(
        SYNDROMES.reduce((acc, s) => ({ ...acc, [s]: '' }), {})
    );
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lang, setLang] = useState('en'); // 'en' | 'hi'

    const t = (key) => {
        if (lang === 'en') return key;
        const map = {
            'Reporting Date': 'रिपोर्टिंग तिथि',
            'Reporting Facility': 'केंद्र का नाम',
            'Fever': 'बुखार (Fever)',
            'Respiratory Issue': 'सांस की तकलीफ',
            'Diarrhea': 'दस्त (Diarrhea)',
            'Jaundice': 'पीलिया (Jaundice)',
            'Rash': 'चकत्ते (Rash)',
            'Neurological': 'नसों की बीमारी (Neurological)',
            'Cholera': 'हैजा (Cholera)',
            'Submit Daily Report': 'रिपोर्ट जमा करें'
        };
        return map[key] || key;
    };

    // Initial Load
    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);

        updatePendingCount();

        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const updatePendingCount = async () => {
        const count = await db.reports.where('status').equals('pending').count();
        setPendingCount(count);
    };

    const handleInputChange = (syndrome, value) => {
        // Allow empty string or numbers
        if (value === '' || /^\d+$/.test(value)) {
            setGrid(prev => ({ ...prev, [syndrome]: value }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const records = [];
            const timestamp = new Date().toISOString();

            // 1. Transform Grid to Records
            Object.entries(grid).forEach(([syndrome, countStr]) => {
                const count = parseInt(countStr);
                if (count && count > 0) {
                    records.push({
                        date: selectedDate,
                        syndrome,
                        count,
                        // Defaulting these for the aggregate view
                        ageGroup: "Mixed",
                        zone: "North Ward",
                        hospitalId: selectedHospitalId, // Save the selected ID
                        status: 'pending',
                        timestamp
                    });
                }
            });

            if (records.length === 0) {
                alert("Please enter at least one value.");
                setIsSaving(false);
                return;
            }

            // 2. Save to Dexie
            await db.reports.bulkAdd(records);

            // 3. UI Feedback
            setGrid(SYNDROMES.reduce((acc, s) => ({ ...acc, [s]: '' }), {})); // Clear form
            await updatePendingCount();

            // Notify Parent (App.jsx) to refresh readiness view
            if (onReportSubmitted) {
                onReportSubmitted();
            }

            // 4. Auto-Sync if Online
            if (isOnline) {
                await syncData();
            } else {
                alert("Saved locally. Will sync when online.");
            }

        } catch (err) {
            console.error(err);
            alert("Error saving records: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const syncData = async () => {
        try {
            const pending = await db.reports.where('status').equals('pending').toArray();
            if (pending.length === 0) return;

            // Simple Batch Upload Logic
            // In a real app, we'd use a bulk endpoint. Here we reuse the loop for compatibility.
            let syncedIds = [];

            // Group by "Request" to minimize calls? Or just loop. 
            // Previous code looped. Let's stick to that for safety unless slow.
            // Actually, let's try to be smart - if we have many, user wants speed.
            // But main.py legacy_report takes one report. So loop is necessary unless we upgrade backend.

            for (const report of pending) {
                // Use the saved hospitalId, or default to 1 if missing (legacy records)
                const targetId = report.hospitalId || 1;
                await axios.post(`http://localhost:8000/facilities/${targetId}/report`, {
                    date: report.date,
                    syndrome: report.syndrome,
                    count: report.count,
                    age_group: report.ageGroup || "Adult",
                    patient_zone: report.zone || "North-1"
                });
                syncedIds.push(report.id);
            }

            // Update Status
            await db.reports.where('id').anyOf(syncedIds).modify({ status: 'synced' });

            setLastSyncTime(new Date());
            await updatePendingCount();

        } catch (err) {
            console.error("Sync Job Failed", err);
            // Don't alert blocking, just log. Status bar will show pending.
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
            {/* Desktop Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center space-x-3">
                    <div className="bg-brand-600 p-2 rounded-lg text-white">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">CareSignal Collect</h1>
                        <p className="text-xs text-slate-500">District Surveillance Unit • Daily Report</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Status Pill */}
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span>{isOnline ? "System Online" : "Offline Mode"}</span>
                    </div>

                    {/* Language Toggle */}
                    <button
                        onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                    >
                        {lang === 'en' ? '🇺🇸 EN' : '🇮🇳 HI'}
                    </button>

                    {/* Pending Sync */}
                    <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Sync Status</div>
                        <div className="flex items-center space-x-2">
                            <div className={`text-sm font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                                {pendingCount} Pending
                            </div>
                            {pendingCount > 0 && isOnline && (
                                <button onClick={syncData} className="p-1 hover:bg-slate-100 rounded-full text-brand-600" title="Force Sync">
                                    <RefreshCw size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 p-8 max-w-5xl mx-auto w-full">

                {/* Control Bar: Date & Facility */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 flex justify-between items-end">
                    <div className="flex space-x-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                <Calendar size={14} className="mr-1" /> {t('Reporting Date')}
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-48 p-2.5"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                <Activity size={14} className="mr-1" /> {t('Reporting Facility')}
                            </label>
                            <select
                                value={selectedHospitalId}
                                onChange={(e) => setSelectedHospitalId(parseInt(e.target.value))}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-80 p-2.5"
                            >
                                {HOSPITALS.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="text-sm text-slate-500 max-w-sm text-right hidden lg:block">
                        <p>Enter the <strong>Total New Cases</strong> for the selected facility.</p>
                    </div>
                </div>

                {/* Data Entry Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-8">Syndrome / Disease Metric</div>
                        <div className="col-span-4">New Cases (Target Date)</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {SYNDROMES.map((syndrome, idx) => (
                            <div key={syndrome} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${grid[syndrome] ? 'bg-indigo-50/30' : 'hover:bg-slate-50'
                                }`}>
                                {/* Label Section */}
                                <div className="col-span-8 flex items-center">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-sm
                                        ${grid[syndrome] ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'}
                                    `}>
                                        {syndrome.charAt(0)}
                                    </div>
                                    <span className={`font-medium text-lg ${grid[syndrome] ? 'text-brand-900' : 'text-slate-700'}`}>
                                        {t(syndrome)}
                                    </span>
                                </div>

                                {/* Input Section */}
                                <div className="col-span-4">
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        className={`
                                            w-full p-3 text-right text-xl font-mono font-bold rounded-lg border outline-none focus:ring-2 focus:ring-brand-500 transition-all
                                            ${grid[syndrome]
                                                ? 'border-brand-300 bg-white text-brand-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-400 focus:bg-white focus:text-slate-900'}
                                        `}
                                        value={grid[syndrome]}
                                        onChange={(e) => handleInputChange(syndrome, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                // Minimal accessibility: move to next input logic could go here
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
                        <div className="text-sm text-slate-500 flex items-center">
                            <AlertCircle size={16} className="mr-2 text-slate-400" />
                            <span>Data is stored locally until synchronized.</span>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`
                                px-8 py-3 rounded-xl font-bold shadow-lg flex items-center space-x-2 transition-all transform active:scale-95
                                ${isSaving
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'}
                            `}
                        >
                            {isSaving ? (
                                <span>Processing...</span>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>{t('Submit Daily Report')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Recent History / Log (Optional future expansion) */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">
                        Need to edit a past report? Contact the District Surveillance Officer.
                    </p>
                </div>

            </main>
        </div>
    );
}
