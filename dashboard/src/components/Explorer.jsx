import React, { useEffect, useState } from 'react';
import { Database, Search, Filter, RefreshCw, X, ChevronRight, Copy, Check, Calendar, Globe, User, Tag } from 'lucide-react';

export default function Explorer({ projectKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/events?search=${encodeURIComponent(searchQuery)}&event=${selectedEventType}&projectKey=${projectKey || ''}&limit=40`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Using fallback events log:', err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedEventType, projectKey]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const copyEventJson = (item) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-stream-item">
      {/* 1. Explorer Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Database className="text-indigo-400" size={22} />
            Raw Event Explorer & Inspector
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Query individual ClickHouse records across all workspaces with granular property filtering.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Table
        </button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Event Name, Session ID, User ID, or URL..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={15} className="text-slate-500" />
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Events</option>
            <option value="$pageview">$pageview</option>
            <option value="button_clicked">button_clicked</option>
            <option value="signup_completed">signup_completed</option>
            <option value="product_viewed">product_viewed</option>
            <option value="checkout_started">checkout_started</option>
            <option value="purchase_completed">purchase_completed</option>
          </select>
        </div>
      </div>

      {/* 3. Event Records Table */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span>Showing {events.length} records</span>
          <span>Click on any row to open side-sheet inspector</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Event Name</th>
                <th className="pb-3 font-semibold">Session UUID</th>
                <th className="pb-3 font-semibold">User ID</th>
                <th className="pb-3 font-semibold">Page / Screen</th>
                <th className="pb-3 font-semibold">IP</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {events.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedEvent(row)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 text-slate-400">{row.timestamp || 'Just now'}</td>
                  <td className="py-3 font-bold">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                      {row.event}
                    </span>
                  </td>
                  <td className="py-3 text-cyan-400 max-w-[140px] truncate">{row.sessionId}</td>
                  <td className="py-3 text-slate-300">{row.userId || '-'}</td>
                  <td className="py-3 text-slate-400 max-w-[180px] truncate">{row.url || '/'}</td>
                  <td className="py-3 text-slate-400">{row.ip || '127.0.0.1'}</td>
                  <td className="py-3 text-right">
                    <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 font-sans text-xs">
                      Inspect <ChevronRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Side Drawer Modal for Detailed Property Inspection */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 animate-stream-item shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-mono uppercase text-indigo-400">Event Details</div>
                  <h4 className="text-xl font-bold text-white font-mono mt-0.5">{selectedEvent.event}</h4>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Core Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-6 font-mono text-xs">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">Session UUID</span>
                  <span className="text-cyan-400 font-semibold break-all">{selectedEvent.sessionId}</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">User ID</span>
                  <span className="text-white font-semibold">{selectedEvent.userId || 'Anonymous'}</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">Client IP</span>
                  <span className="text-slate-300 font-semibold">{selectedEvent.ip}</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">Project Key</span>
                  <span className="text-slate-300 font-semibold">{selectedEvent.projectKey}</span>
                </div>
              </div>

              {/* Event Custom Properties Map */}
              <div className="mt-6 space-y-2">
                <div className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Tag size={13} className="text-indigo-400" />
                  Custom Properties Map (ClickHouse Map(String, String))
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                  {selectedEvent.properties && Object.keys(selectedEvent.properties).length > 0 ? (
                    Object.entries(selectedEvent.properties).map(([k, v], i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-800/60 last:border-none">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-indigo-300 font-semibold">{String(v)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 py-2 text-center">No custom payload properties attached.</div>
                  )}
                </div>
              </div>

              {/* Raw JSON View */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-400">Complete JSON Schema</span>
                  <button
                    onClick={() => copyEventJson(selectedEvent)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-indigo-300 font-mono text-xs overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors mt-6 font-mono"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
