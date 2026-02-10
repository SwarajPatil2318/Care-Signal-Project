import React from 'react';
import { User, Activity, BrainCircuit, FileText, ArrowLeft, AlertCircle, Clock, Calendar, CheckCircle } from 'lucide-react';

export default function DoctorPatientView({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">

            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section */}
                <div className="bg-slate-900 text-white p-6 relative">
                    <button
                        onClick={onBack}
                        className="absolute top-6 left-6 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex flex-col items-center mt-2">
                        <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-slate-800 shadow-lg text-indigo-100 mb-4">
                            SP
                        </div>
                        <h1 className="text-2xl font-bold text-center">Swaraj Patil</h1>
                        <div className="flex items-center space-x-3 mt-2 text-sm text-slate-400 font-medium">
                            <span>24 Yrs</span>
                            <span>•</span>
                            <span>Male</span>
                            <span>•</span>
                            <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded">O+</span>
                        </div>

                        {/* Critical Allergies Badge */}
                        <div className="mt-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-full flex items-center text-xs font-bold uppercase tracking-wider animate-pulse">
                            <AlertCircle size={14} className="mr-2" />
                            Allergies: Penicillin
                        </div>
                    </div>
                </div>

                {/* AI Clinical Summary */}
                <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                    <div className="flex items-start space-x-4">
                        <div className="bg-indigo-600 p-3 rounded-lg text-white shadow-md flex-shrink-0">
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center">
                                AI Clinical Summary
                                <span className="ml-2 px-2 py-0.5 bg-indigo-200 text-indigo-800 text-[10px] rounded-full">Beta</span>
                            </h3>
                            <p className="text-slate-700 text-sm leading-relaxed font-medium">
                                "Patient has a history of recurring respiratory issues (3 visits in 6 months).
                                Correlates with local AQI spikes.
                                <span className="block mt-2 font-bold text-indigo-700">Recommended: Spirometry Test.</span>"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Medical History Timeline */}
                <div className="p-8 bg-white">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                        <Clock size={14} className="mr-2" /> Medical History Timeline
                    </h3>

                    <div className="space-y-0 relative border-l-2 border-slate-100 ml-3 pl-8 pb-4">

                        {/* Event 1 */}
                        <div className="relative mb-8 group">
                            <div className="absolute -left-[41px] bg-white border-4 border-indigo-500 w-6 h-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"></div>

                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-slate-900">Viral Fever Treatment</span>
                                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Feb 08, 2026</span>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">Dr. Roy • City General Hospital</div>

                            <button className="flex items-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 transition-colors">
                                <FileText size={12} className="mr-2" /> View Report
                            </button>
                        </div>

                        {/* Event 2 */}
                        <div className="relative mb-8 group">
                            <div className="absolute -left-[41px] bg-slate-200 border-4 border-white w-6 h-6 rounded-full shadow-sm"></div>

                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-slate-800">Annual Checkup</span>
                                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Jan 20, 2026</span>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">Dr. Sharma • LifeCare Clinic</div>
                            <div className="text-xs text-slate-400 italic">Vitals Normal. Prescribed Multivitamins.</div>
                        </div>

                        {/* Event 3 */}
                        <div className="relative group">
                            <div className="absolute -left-[41px] bg-slate-200 border-4 border-white w-6 h-6 rounded-full shadow-sm"></div>

                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-slate-800">MRI Scan (Knee)</span>
                                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Dec 15, 2025</span>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">Radiance Diagnostics</div>

                            <button className="flex items-center text-xs font-bold text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-200 transition-colors">
                                <FileText size={12} className="mr-2" /> View Scan
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg flex items-center transition-all">
                        <CheckCircle size={18} className="mr-2" />
                        Verify & Admit
                    </button>
                </div>

            </div>
        </div>
    );
}
