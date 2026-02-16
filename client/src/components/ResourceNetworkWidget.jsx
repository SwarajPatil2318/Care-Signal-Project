import React, { useState } from 'react';
import { Truck, MapPin, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResourceNetworkWidget = ({ localStock, projections }) => {
    const [requestStatus, setRequestStatus] = useState(null);

    // Mock Data for Neighboring Facilities
    const neighboringFacilities = [
        {
            id: 'facility-a',
            name: 'Rural PHC - Wagholi',
            distance: '12km',
            type: 'Primary Health Center',
            stock: {
                ivFluids: { quantity: 50, status: 'Surplus' },
                o2Cylinders: { quantity: 2, status: 'Critical' }
            }
        },
        {
            id: 'facility-b',
            name: 'District Hospital - Satara',
            distance: '45km',
            type: 'District Hospital',
            stock: {
                ivFluids: { quantity: 200, status: 'Surplus' },
                o2Cylinders: { quantity: 15, status: 'Normal' }
            }
        }
    ];

    // Check critical shortages in local stock
    // Logic: Critical if projected demand > current stock
    const isIvFluidsCritical = projections.ivFluids > localStock.ivFluids;
    
    // Auto-recommendation logic
    const recommendedFacilityId = isIvFluidsCritical ? 'facility-a' : null;

    const handleRequestTransfer = (facilityName) => {
        // Show toast notification
        const message = `Transfer Request sent to MO at ${facilityName}.`;
        
        // In a real app, we would use a toast library. 
        // For now, let's use a simple state to show the message temporarily or just alert.
        // The requirements say "show a toast notification". 
        // Since I didn't see a toast library in package.json (except maybe simple alerts), 
        // I will create a temporary visual toast in this component or use window.alert if simple.
        // But for better UI, I'll add a temporary banner state here.
        
        setRequestStatus(message);
        setTimeout(() => setRequestStatus(null), 3000);
    };

    return (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <Truck className="mr-2 text-indigo-600" size={20} />
                        Inter-Facility Resource Grid
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Real-time supply chain visibility for neighboring nodes.</p>
                </div>
                {isIvFluidsCritical && (
                     <div className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center animate-pulse">
                        <AlertCircle size={14} className="mr-1.5" />
                        Supply Scarcity Detected
                     </div>
                )}
            </div>

            {/* Toast Notification */}
            {requestStatus && (
                <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center z-50 animate-bounce-in">
                    <CheckCircle2 className="mr-2 text-emerald-400" size={20} />
                    {requestStatus}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3">Facility Name</th>
                            <th className="px-6 py-3">Distance</th>
                            <th className="px-6 py-3">IV Fluids Data</th>
                             <th className="px-6 py-3">Oxygen Data</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {neighboringFacilities.map((facility) => {
                            const isRecommended = facility.id === recommendedFacilityId;
                            
                            return (
                                <tr 
                                    key={facility.id} 
                                    className={`transition-colors ${isRecommended ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{facility.name}</div>
                                        <div className="text-xs text-slate-400">{facility.type}</div>
                                        {isRecommended && (
                                            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center">
                                                <CheckCircle2 size={12} className="mr-1" />
                                                Recommended Source
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-slate-600">
                                            <MapPin size={16} className="mr-1.5 text-slate-400" />
                                            {facility.distance}
                                        </div>
                                    </td>
                                    {/* IV Fluids Column */}
                                    <td className="px-6 py-4">
                                         <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{facility.stock.ivFluids.quantity} Units</span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit mt-1 ${
                                                facility.stock.ivFluids.status === 'Surplus' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {facility.stock.ivFluids.status}
                                            </span>
                                         </div>
                                    </td>
                                    {/* Oxygen Column */}
                                    <td className="px-6 py-4">
                                         <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{facility.stock.o2Cylinders.quantity} Cylinders</span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit mt-1 ${
                                                facility.stock.o2Cylinders.status === 'Surplus' ? 'bg-emerald-100 text-emerald-700'
                                                : facility.stock.o2Cylinders.status === 'Normal' ? 'bg-slate-100 text-slate-600'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                                {facility.stock.o2Cylinders.status}
                                            </span>
                                         </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isRecommended && isIvFluidsCritical ? (
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-xs font-medium text-emerald-700 max-w-[150px] leading-tight mb-1">
                                                    Recommended: Request 20 units from Wagholi ({facility.distance} away).
                                                </div>
                                                <button 
                                                    onClick={() => handleRequestTransfer(facility.name)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95 flex items-center ml-auto"
                                                >
                                                    <Truck size={14} className="mr-1.5" />
                                                    Request Transfer
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleRequestTransfer(facility.name)}
                                                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95"
                                            >
                                                Request
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResourceNetworkWidget;
