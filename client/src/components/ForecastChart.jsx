import React, { useMemo } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function ForecastChart({ history, forecast, baseline }) {

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];

        // 1. Process History
        // Format: { type: 'history', date: 'YYYY-MM-DD', value: 123 }
        const data = history.map(h => ({
            date: h.date.slice(5), // MM-DD
            fullDate: h.date,
            actual: h.value,
            predicted: null,
            range: [null, null]
        }));

        const lastHist = history[history.length - 1];

        // 2. Process Forecast
        // We need to connect the lines, so the first point of forecast 
        // should be the last point of history
        if (forecast && forecast.length > 0) {
            forecast.forEach(f => {
                data.push({
                    date: f.date ? f.date.slice(5) : `+${f.day}d`,
                    actual: null,
                    predicted: f.value,
                    lower: f.lower_bound,
                    upper: f.upper_bound
                });
            });
        }
        return data;
    }, [history, forecast]);

    if (!history || history.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 text-xs">No Data</div>;

    return (
        <div className="w-full h-full min-h-[100px] p-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#cbd5e1" interval="preserveStartEnd" minTickGap={10} />
                    <YAxis tick={{ fontSize: 9 }} stroke="#cbd5e1" />

                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '4px 8px' }}
                    />

                    {/* Baseline */}
                    {baseline && <ReferenceLine y={baseline} stroke="#cbd5e1" strokeDasharray="3 3" />}

                    {/* Measurement Date Line */}
                    <ReferenceLine x={chartData[history.length - 1]?.date} stroke="#94a3b8" strokeDasharray="3 3" />

                    {/* Confidence Interval (Area) */}
                    <Area
                        type="monotone"
                        dataKey="upper"
                        stroke="none"
                        fill="#6366f1"
                        fillOpacity={0.1}
                    />

                    {/* Actual History (Solid Blue) */}
                    <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls={false}
                    />

                    {/* Predicted (Dashed Indigo) */}
                    <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                    />


                    {/* Lower/Upper Bounds as thin lines for CI */}
                    <Line type="monotone" dataKey="upper" stroke="#6366f1" strokeWidth={1} strokeOpacity={0.3} dot={false} />
                    <Line type="monotone" dataKey="lower" stroke="#6366f1" strokeWidth={1} strokeOpacity={0.3} dot={false} />

                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
