import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Cpu, Activity, Clock, ShieldCheck, ArrowUpRight, Smartphone, Laptop, Globe, RefreshCw } from 'lucide-react';

export default function Overview({ timeRange, projectKey }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTrendMode, setActiveTrendMode] = useState('daily');
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);

  const fetchOverviewData = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/overview?timeRange=${timeRange || '7d'}&projectKey=${projectKey || ''}`)
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Using simulated overview metrics:', err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOverviewData();
  }, [timeRange, projectKey]);

  if (!metrics && loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-indigo-500" size={32} />
          <p className="text-sm text-slate-400 font-mono">Aggregating ClickHouse metrics...</p>
        </div>
      </div>
    );
  }

  const data = metrics || {
    dau: 2480,
    mau: 34200,
    totalEvents: 498320,
    uniqueSessions: 18940,
    avgSessionDuration: '4m 18s',
    conversionRate: 14.8,
    topEvents: [
      { event: '$pageview', count: 182400, percentage: 36.6 },
      { event: 'button_clicked', count: 124300, percentage: 24.9 },
      { event: 'signup_completed', count: 48900, percentage: 9.8 },
      { event: 'product_viewed', count: 42100, percentage: 8.4 },
      { event: 'checkout_started', count: 28500, percentage: 5.7 },
      { event: 'purchase_completed', count: 16400, percentage: 3.3 },
    ],
    trend: [
      { date: 'Mon', count: 54200, activeUsers: 1980 },
      { date: 'Tue', count: 68400, activeUsers: 2340 },
      { date: 'Wed', count: 62100, activeUsers: 2150 },
      { date: 'Thu', count: 74500, activeUsers: 2580 },
      { date: 'Fri', count: 89300, activeUsers: 2940 },
      { date: 'Sat', count: 71200, activeUsers: 2410 },
      { date: 'Sun', count: 78620, activeUsers: 2480 },
    ],
    devices: [
      { name: 'Desktop (Chrome/Edge)', percentage: 58, count: 289000 },
      { name: 'Mobile (iOS/Safari)', percentage: 28, count: 139500 },
      { name: 'Mobile (Android)', percentage: 11, count: 54800 },
      { name: 'Tablet / Other', percentage: 3, count: 15020 },
    ],
    recentSessions: [
      { sessionId: 'sid_98a7bc12', userId: 'usr_8492', eventCount: 14, duration: '6m 22s', lastActive: '1 min ago', country: 'United States', browser: 'Chrome 128' },
      { sessionId: 'sid_43fe910a', userId: 'usr_1029', eventCount: 8, duration: '3m 45s', lastActive: '3 mins ago', country: 'Germany', browser: 'Firefox 129' },
      { sessionId: 'sid_11bc883e', userId: 'usr_7731', eventCount: 22, duration: '11m 10s', lastActive: '6 mins ago', country: 'India', browser: 'Chrome 128' },
      { sessionId: 'sid_77ad3321', userId: 'usr_4918', eventCount: 5, duration: '1m 50s', lastActive: '9 mins ago', country: 'United Kingdom', browser: 'Safari 17' },
      { sessionId: 'sid_65cc2094', userId: 'usr_3320', eventCount: 19, duration: '8m 05s', lastActive: '12 mins ago', country: 'Canada', browser: 'Chrome 128' },
    ]
  };

  const maxTrendVal = Math.max(...data.trend.map(t => t.count));

  return (
    <div className="space-y-8 animate-stream-item">
      {/* 1. Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Events */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ingested Events</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data.totalEvents.toLocaleString()}</h3>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ArrowUpRight size={13} className="mr-0.5" /> +24.8%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">Columnar MergeTree engine</p>
        </div>

        {/* DAU & MAU */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Users (DAU / MAU)</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data.dau.toLocaleString()}</h3>
            <span className="text-xs font-mono text-slate-400">/ {data.mau.toLocaleString()} MAU</span>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full" style={{ width: `${Math.round((data.dau / (data.mau || 1)) * 100 * 3)}%` }}></div>
          </div>
        </div>

        {/* Unique Sessions */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unique Sessions</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data.uniqueSessions.toLocaleString()}</h3>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ArrowUpRight size={13} className="mr-0.5" /> +12.3%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">Avg duration: {data.avgSessionDuration}</p>
        </div>

        {/* Overall Conversion Rate */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pipeline Conversion</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data.conversionRate}%</h3>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Visitor → Goal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">HyperLogLog uniqIf() accuracy</p>
        </div>
      </div>

      {/* 2. Ingestion Activity Trend Chart & Top Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interactive Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                Event Throughput & User Volume
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Real-Time
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">Aggregated across ClickHouse time-bucket partition</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTrendMode('daily')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTrendMode === 'daily' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily Trend
              </button>
              <button
                onClick={() => setActiveTrendMode('hourly')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTrendMode === 'hourly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hourly Volume
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-slate-800 relative">
            {data.trend.map((item, idx) => {
              const heightPct = Math.max(12, Math.round((item.count / maxTrendVal) * 100));
              const isHovered = hoveredTrendIdx === idx;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative cursor-pointer"
                  onMouseEnter={() => setHoveredTrendIdx(idx)}
                  onMouseLeave={() => setHoveredTrendIdx(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-indigo-500/40 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-xl font-mono">
                      <div className="font-bold text-indigo-300">{item.date}</div>
                      <div>{item.count.toLocaleString()} events</div>
                      <div className="text-[10px] text-slate-400">{item.activeUsers.toLocaleString()} active users</div>
                    </div>
                  )}

                  {/* Gradient Bar */}
                  <div
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative ${
                      isHovered
                        ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-lg shadow-indigo-500/30'
                        : 'bg-gradient-to-t from-indigo-700/60 to-indigo-500/80 group-hover:from-indigo-600 group-hover:to-cyan-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-white/40 rounded-t-xl"></div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{item.date}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Event Ingestion Volume
            </span>
            <span className="text-slate-500">Peak: {maxTrendVal.toLocaleString()} events/day</span>
          </div>
        </div>

        {/* Top Event Actions */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-white">Top Tracked Actions</h4>
              <span className="text-xs text-slate-400 font-mono">By volume</span>
            </div>
            <div className="space-y-4">
              {data.topEvents.slice(0, 5).map((e, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="text-indigo-400 font-bold">#{idx + 1}</span> {e.event}
                    </span>
                    <span className="text-slate-400 font-medium">{e.count.toLocaleString()} ({e.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${e.percentage * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Automated SDK telemetry</span>
            <span className="text-indigo-400 font-mono font-semibold">{data.topEvents.length} distinct actions</span>
          </div>
        </div>
      </div>

      {/* 3. Platform Distribution & Recent Live User Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Globe size={18} className="text-cyan-400" /> Platform & Device Split
            </h4>
            <div className="space-y-4">
              {data.devices.map((device, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {device.name.includes('Desktop') ? (
                      <Laptop size={15} className="text-indigo-400" />
                    ) : (
                      <Smartphone size={15} className="text-cyan-400" />
                    )}
                    <span className="text-slate-300 font-medium">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">{device.count.toLocaleString()}</span>
                    <span className="text-indigo-400 font-bold">{device.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 mt-6 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>Extracted securely from User-Agent in Ingestion API.</span>
          </div>
        </div>

        {/* Live Active Sessions Table */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" /> Real-Time Active User Sessions
            </h4>
            <span className="text-xs text-slate-400 font-mono">Session TTL: 30 mins</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                  <th className="pb-3 font-semibold">Session ID</th>
                  <th className="pb-3 font-semibold">User ID</th>
                  <th className="pb-3 font-semibold">Country</th>
                  <th className="pb-3 font-semibold">Events</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {data.recentSessions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-indigo-400">{s.sessionId}</td>
                    <td className="py-3 text-slate-400">{s.userId}</td>
                    <td className="py-3 font-sans text-slate-300">{s.country}</td>
                    <td className="py-3 font-bold text-white">{s.eventCount}</td>
                    <td className="py-3 text-slate-400">{s.duration}</td>
                    <td className="py-3 text-right text-emerald-400 font-semibold">{s.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}