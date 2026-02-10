import React from 'react';
import { User, Activity, FileText, CheckCircle, ArrowLeft, Heart, Thermometer } from 'lucide-react';

export default function DoctorView({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">

            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-indigo-600 p-6 text-white relative">
                    <button
                        onClick={onBack}
                        className="absolute top-4 left-4 p-2 bg-indigo-500 rounded-full hover:bg-indigo-400 transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div className="text-center mt-4">
                        <div className="w-20 h-20 bg-indigo-400 rounded-full mx-auto flex items-center justify-center mb-3 text-2xl font-bold border-4 border-indigo-300">
                            SP
                        </div>
                        <h1 className="text-xl font-bold">Swaraj Patil</h1>
                        <p className="text-indigo-200 text-sm">Male • 29 Yrs • O+</p>
                    </div>
                </div>

                {/* Scanned Data */}
                <div className="p-6 space-y-6">

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center space-x-3">
                        <CheckCircle className="text-emerald-500" />
                        <div>
                            <div className="font-bold text-emerald-800">Identity Verified</div>
                            <div className="text-xs text-emerald-600">Scanned via CareSignal ID</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Vitals (Synced)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                                <Heart className="mx-auto text-red-500 mb-2" size={20} />
                                <div className="text-2xl font-bold text-slate-900">72</div>
                                <div className="text-xs text-slate-400">BPM</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                                <Thermometer className="mx-auto text-amber-500 mb-2" size={20} />
                                <div className="text-2xl font-bold text-slate-900">98.6</div>
                                <div className="text-xs text-slate-400">°F</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Medical History</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border-b border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-indigo-50 p-2 rounded text-indigo-500"><FileText size={16} /></div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">Viral Fever Treatment</div>
                                        <div className="text-xs text-slate-400">Jan 20 • Dr. Sharma</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border-b border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-indigo-50 p-2 rounded text-indigo-500"><FileText size={16} /></div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">Annual Physical</div>
                                        <div className="text-xs text-slate-400">Dec 15 • City General</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg">
                        Add Consultation Note
                    </button>

                </div>
            </div>
        </div>
    );
}
