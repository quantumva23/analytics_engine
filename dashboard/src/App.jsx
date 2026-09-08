import React, { useState } from 'react';
import {
  BarChart3,
  Filter,
  RotateCcw,
  Activity,
  Database,
  Rocket,
  Code,
  Layers,
  ChevronDown,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  Search,
  Bell,
  Cpu
} from 'lucide-react';
import Overview from './components/Overview';
import Funnel from './components/Funnel';
import Retention from './components/Retention';
import Live from './components/Live';
import Explorer from './components/Explorer';
import Simulator from './components/Simulator';
import SdkEmbed from './components/SdkEmbed';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d'); // 24h | 7d | 30d | 90d
  const [selectedWorkspace, setSelectedWorkspace] = useState({
    id: 'ws_prod_9876',
    name: 'Production App',
    projectKey: 'proj_live_test_9876543210',
    env: 'production',
  });
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  const workspaces = [
    { id: 'ws_prod_9876', name: 'Production App', projectKey: 'proj_live_test_9876543210', env: 'production' },
    { id: 'ws_stage_1234', name: 'Staging Environment', projectKey: 'proj_stage_test_1234567890', env: 'staging' },
    { id: 'ws_mobile_5544', name: 'Mobile iOS/Android', projectKey: 'proj_mobile_test_5544332211', env: 'production' },
  ];

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: BarChart3, badge: null },
    { id: 'funnel', name: 'Funnel Builder', icon: Filter, badge: 'D3' },
    { id: 'retention', name: 'Cohort Retention', icon: RotateCcw, badge: 'Heatmap' },
    { id: 'live', name: 'Real-Time Live', icon: Activity, badge: 'SSE' },
    { id: 'explorer', name: 'Events Explorer', icon: Database, badge: null },
    { id: 'simulator', name: 'App Simulator', icon: Rocket, badge: 'Interactive' },
    { id: 'embed', name: 'SDK Embed Center', icon: Code, badge: '2 Lines' },
  ];

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-[#0d1322]/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none backdrop-blur-xl z-20">
        <div>
          {/* Logo & Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Cpu size={20} />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  StreamPulse
                  <span className="text-[10px] uppercase font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                    μ-SaaS
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-mono">Self-Hosted Analytics Engine</p>
              </div>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="px-4 pt-4 relative">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5 block font-mono">
              Active Workspace
            </label>
            <button
              onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-xs font-semibold text-left transition-all shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2 h-2 rounded-full ${selectedWorkspace.env === 'production' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className="truncate text-slate-200">{selectedWorkspace.name}</span>
              </div>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isWorkspaceDropdownOpen && (
              <div className="absolute left-4 right-4 mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-30 py-1 font-mono text-xs overflow-hidden">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setSelectedWorkspace(ws);
                      setIsWorkspaceDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-600/20 transition-colors ${
                      selectedWorkspace.id === ws.id ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{ws.env}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 block font-mono">
              Analytics Modules
            </span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Status Badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Pipeline Live
            </span>
            <span className="text-indigo-400 font-bold">ClickHouse DB</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate font-mono">
            Key: {selectedWorkspace.projectKey.slice(0, 16)}...
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top App Header */}
        <header className="h-16 bg-[#0d1322]/80 border-b border-slate-800/80 flex items-center justify-between px-8 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 capitalize">
              {activeTab === 'embed' ? 'SDK Integration Center' : activeTab.replace('-', ' ')}
            </h2>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-500">/</span>
            <span className="hidden sm:inline-block text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
              {selectedWorkspace.name}
            </span>
          </div>

          {/* Time Range Filter & Actions */}
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs font-mono">
              {[
                { id: '24h', label: '24H' },
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    timeRange === range.id
                      ? 'bg-indigo-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Live SSE Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Streaming (Redpanda/SSE)
            </div>
          </div>
        </header>

        {/* Scrollable Tab Views */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-[#090d16] to-[#0b0f19]">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'overview' && (
              <Overview timeRange={timeRange} projectKey={selectedWorkspace.projectKey} />
            )}
            {activeTab === 'funnel' && (
              <Funnel projectKey={selectedWorkspace.projectKey} />
            )}
            {activeTab === 'retention' && (
              <Retention projectKey={selectedWorkspace.projectKey} />
            )}
            {activeTab === 'live' && (
              <Live projectKey={selectedWorkspace.projectKey} />
            )}
            {activeTab === 'explorer' && (
              <Explorer projectKey={selectedWorkspace.projectKey} />
            )}
            {activeTab === 'simulator' && (
              <Simulator projectKey={selectedWorkspace.projectKey} />
            )}
            {activeTab === 'embed' && (
              <SdkEmbed projectKey={selectedWorkspace.projectKey} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;