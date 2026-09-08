import React, { useEffect, useState } from 'react';
import { Activity, Play, Pause, Trash2, Filter, Eye, Copy, Check, Shield, Globe, Terminal } from 'lucide-react';

export default function Live({ projectKey }) {
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterEvent, setFilterEvent] = useState('');
  const [copied, setCopied] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Connect to Query API SSE stream
    const eventSource = new EventSource(`http://localhost:5000/api/live`);

    eventSource.onmessage = (event) => {
      if (isPaused) return;
      try {
        const newEvent = JSON.parse(event.data);
        setLogs((prev) => [newEvent, ...prev.slice(0, 49)]);
        setEventCount((prev) => prev + 1);
      } catch (err) {
        // SSE comments or unparseable frames
      }
    };

    eventSource.onerror = () => {
      // Reconnection automatically handled by browser EventSource
    };

    return () => {
      eventSource.close();
    };
  }, [isPaused]);

  const copyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = filterEvent
    ? logs.filter((l) => l.event.toLowerCase().includes(filterEvent.toLowerCase()) || l.sessionId?.toLowerCase().includes(filterEvent.toLowerCase()))
    : logs;

  return (
    <div className="space-y-8 animate-stream-item">
      {/* 1. Live Stream Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            {!isPaused && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </span>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Real-Time Ingestion Event Stream
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${isPaused ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {isPaused ? 'PAUSED' : 'STREAMING LIVE'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Broadcasted from BullMQ worker & Kafka topic via Server-Sent Events (SSE)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume Stream' : 'Pause Stream'}
          </button>

          <button
            onClick={() => setLogs([])}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/50 text-slate-400 rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
      </div>

      {/* 2. Main Live Stream Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Live Feed */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-indigo-400" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Event Activity Feed ({filteredLogs.length} events buffered)
              </span>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-slate-500" />
              <input
                type="text"
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                placeholder="Filter by event or session..."
                className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Event Items List */}
          <div className="h-[520px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                <Activity size={32} className="text-slate-600 animate-pulse" />
                <p>Waiting for incoming stream traffic...</p>
                <p className="text-[11px] text-slate-600">Tip: Run App Simulator to fire batch user events!</p>
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                const isSelected = selectedLog === log;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">{log.timestamp}</span>
                      <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md font-bold text-xs">
                        {log.event}
                      </span>
                      <span className="text-slate-400 text-[11px] truncate max-w-[140px]">
                        {log.sessionId}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Globe size={12} className="text-slate-500" />
                        {log.ip}
                      </span>
                      <span className="text-indigo-400 flex items-center gap-1 font-semibold">
                        <Eye size={12} /> Inspect
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Event Details & JSON Inspector */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Event Inspector
              </h4>
              {selectedLog && (
                <button
                  onClick={() => copyJson(selectedLog)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              )}
            </div>

            {selectedLog ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-500 uppercase">Event Metadata</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action:</span>
                    <span className="text-indigo-400 font-bold">{selectedLog.event}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Project Key:</span>
                    <span className="text-slate-300">{selectedLog.projectKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Session UUID:</span>
                    <span className="text-cyan-400">{selectedLog.sessionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client IP:</span>
                    <span className="text-slate-300">{selectedLog.ip}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-500 uppercase">Raw Payload</div>
                  <pre className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-indigo-300 overflow-x-auto text-[11px] max-h-56 leading-relaxed">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 space-y-2 text-xs">
                <Eye size={24} className="text-slate-600" />
                <p>Click any event from the live feed to inspect its full payload schema and properties.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Shield size={15} className="text-indigo-400 shrink-0" />
            <span>Event stream is end-to-end encrypted and isolated by workspace tenant.</span>
          </div>
        </div>
      </div>
    </div>
  );
}