import React, { useState, useEffect } from 'react';
import CollectPage from './pages/CollectPage';
import DashboardPage from './pages/DashboardPage';
import PredictiveAnalysisPage from './pages/PredictiveAnalysisPage';
import PredictionComparisonPage from './pages/PredictionComparisonPage';
import HospitalReadiness from './components/HospitalReadiness';
import PatientDashboard from './components/PatientDashboard';
import DoctorPatientView from './components/DoctorPatientView';
import { db } from './db';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-red-600 bg-red-50 min-h-screen">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <pre className="text-sm bg-white p-4 rounded border border-red-200 overflow-auto">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

function App() {
    const [view, setView] = useState('collect'); // 'collect' | 'dashboard' | 'comparison' | 'hospital' | 'patient' | 'doctor'
    const [caseReports, setCaseReports] = useState([]);

    const refreshReports = async () => {
        try {
            const reports = await db.reports.toArray();
            setCaseReports(reports);
        } catch (e) {
            console.error("Failed to load reports", e);
        }
    };

    useEffect(() => {
        refreshReports();
    }, []);

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50 relative">

                {/* Dev Navigation (Fixed Toggle) - Hide in Doctor View for realism */}
                {view !== 'doctor' && (
                    <div className="fixed bottom-6 right-6 z-[100] flex gap-2 bg-white p-2 rounded-full border border-slate-200 shadow-xl shadow-slate-900/10 flex-wrap justify-end max-w-[90vw]">
                        <button
                            onClick={() => setView('collect')}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'collect'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            Collect
                        </button>
                        <button
                            onClick={() => setView('hospital')}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'hospital'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            Hospital Readiness
                        </button>
                        <button
                            onClick={() => setView('patient')}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'patient'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            Patient Portal
                        </button>
                        <button
                            onClick={() => setView('dashboard')}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'dashboard'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            DHO Dashboard
                        </button>
                        <button
                            onClick={() => setView('comparison')}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'comparison'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            Risk Comparison
                        </button>
                    </div>
                )}

                {view === 'collect' && <CollectPage onReportSubmitted={refreshReports} />}
                {view === 'hospital' && <HospitalReadiness caseReports={caseReports} />}
                {view === 'patient' && <PatientDashboard caseReports={caseReports} onNavigateToDoctor={() => setView('doctor')} />}
                {view === 'doctor' && <DoctorPatientView onBack={() => setView('patient')} />}
                {view === 'dashboard' && <DashboardPage onNavigate={setView} />}
                {view === 'analysis' && <PredictiveAnalysisPage onBack={() => setView('dashboard')} />}
                {view === 'comparison' && <PredictionComparisonPage onBack={() => setView('dashboard')} />}
            </div>
        </ErrorBoundary>
    );
}

export default App;
