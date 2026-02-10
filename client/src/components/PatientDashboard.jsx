import React from 'react';
import { User, Activity, MapPin, FileText, Upload, AlertCircle, CheckCircle, QrCode, ShieldCheck } from 'lucide-react';
import QRCode from "react-qr-code"; // This is a standard react lib for QR codes

export default function PatientDashboard({ caseReports, onNavigateToDoctor }) {
    // Logic: Simulate dynamic load based on total reports
    // If reports > 15, "City General" is overloaded because it's the main hub in our story.
    const totalLoad = caseReports.length;
    const isCityGeneralOverloaded = totalLoad > 15;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6 pb-24">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome, Swaraj</h1>
                    <p className="text-sm text-slate-500">Patient ID: CS-8821-XJ</p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                    <Activity size={18} className="text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">Health Status:</span>
                    <span className="text-sm font-bold text-emerald-600">Stable</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Feature 1: Smart Hospital Finder */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                            <MapPin className="mr-2 text-indigo-600" /> Nearby Care Locations
                        </h2>
                        <div className="space-y-4">
                            {/* Hospital 1: City General (Dynamic) */}
                            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <div>
                                    <h3 className="font-bold text-slate-900">City General Hospital</h3>
                                    <p className="text-xs text-slate-500">2.4 km away • Multi-Specialty</p>
                                </div>
                                {isCityGeneralOverloaded ? (
                                    <div className="text-right">
                                        <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full mb-1">
                                            <AlertCircle size={12} className="mr-1" /> High Wait Time
                                        </div>
                                        <div className="text-xs text-slate-400">ER Load: Critical</div>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <div className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-1">
                                            <CheckCircle size={12} className="mr-1" /> Recommended
                                        </div>
                                        <div className="text-xs text-slate-400">Wait: 15 mins</div>
                                    </div>
                                )}
                            </div>

                            {/* Hospital 2: LifeCare (Always Good) */}
                            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <div>
                                    <h3 className="font-bold text-slate-900">LifeCare Clinic</h3>
                                    <p className="text-xs text-slate-500">0.8 km away • Primary Care</p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-1">
                                        <CheckCircle size={12} className="mr-1" /> Recommended
                                    </div>
                                    <div className="text-xs text-slate-400">Wait: 5 mins</div>
                                </div>
                            </div>

                            {/* Hospital 3: Ortho Center */}
                            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-50 border border-slate-100 opacity-60">
                                <div>
                                    <h3 className="font-bold text-slate-900">Ortho Center</h3>
                                    <p className="text-xs text-slate-500">4.1 km away • Specialist</p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full mb-1">
                                        Create Appt
                                    </div>
                                    <div className="text-xs text-slate-400">By Appointment</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Medical Vault */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                <ShieldCheck className="mr-2 text-indigo-600" /> My Medical Vault
                            </h2>
                            <button className="text-xs font-bold text-indigo-600 flex items-center hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Upload size={14} className="mr-1" /> Upload New
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-red-50 p-2 rounded text-red-500"><FileText size={20} /></div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">Blood Test Report (CBC)</div>
                                        <div className="text-xs text-slate-400">Feb 08, 2026 • 1.2 MB</div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">PDF</span>
                            </div>

                            <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-emerald-50 p-2 rounded text-emerald-500"><FileText size={20} /></div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">Prescription - Dr. Sharma</div>
                                        <div className="text-xs text-slate-400">Jan 20, 2026 • Main Complaint: Fever</div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">IMG</span>
                            </div>

                            <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-50 p-2 rounded text-blue-500"><FileText size={20} /></div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">MRI Scan - Knee</div>
                                        <div className="text-xs text-slate-400">Dec 15, 2025 • Radiance Diagnostics</div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">PDF</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 3: Emergency ID (Right Column) */}
                <div>
                    <div
                        onClick={onNavigateToDoctor}
                        className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <Activity size={32} className="text-indigo-200" />
                            <div className="text-right">
                                <div className="text-xs font-bold opacity-60 uppercase tracking-wider">Emergency ID</div>
                                <div className="font-mono font-bold tracking-widest">CS-8821</div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl mb-6 flex justify-center items-center h-48 w-full group-hover:shadow-inner transition-shadow">
                            <div className="text-slate-900">
                                <QRCode value="https://caresignal.app/doctor-view/CS-8821" size={140} />
                            </div>
                        </div>

                        <div className="text-center relative z-10">
                            <div className="font-bold text-lg">Swaraj Patil</div>
                            <div className="text-indigo-200 text-sm mb-4">Blood Group: B+</div>
                            <p className="text-xs text-indigo-300">
                                Start Scan to access full medical history.
                                <br />(Tap card to simulate scan)
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Vitals</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Blood Pressure</span>
                                <span className="text-sm font-bold text-slate-900">120/80</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Heart Rate</span>
                                <span className="text-sm font-bold text-slate-900">72 bpm</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Weight</span>
                                <span className="text-sm font-bold text-slate-900">70 kg</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
