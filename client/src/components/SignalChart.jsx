import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import axios from 'axios';

export default function SignalChart({ signalId, baseline }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/signals/${signalId}/history`);
                // Format date for chart
                const formatted = res.data.map(d => ({
                    ...d,
                    date: d.date.slice(5) // "11-02" instead of "2023-11-02"
                }));
                setData(formatted);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [signalId]);

    if (loading) return <div className="h-48 flex items-center justify-center text-xs text-slate-400">Loading trend...</div>;

    return (
        <div className="h-64 w-full mt-4 bg-slate-50 rounded-lg p-2 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">14-Day Trend vs Baseline</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748b', fontSize: '12px' }}
                    />
                    <ReferenceLine y={baseline} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Baseline', fill: '#ef4444', fontSize: 10 }} />
                    <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
