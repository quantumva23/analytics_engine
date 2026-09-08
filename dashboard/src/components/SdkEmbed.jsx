import React, { useState } from 'react';
import { Code, Copy, Check, Terminal, ExternalLink, Key, ShieldCheck, Zap, Layers, Globe } from 'lucide-react';

export default function SdkEmbed({ projectKey }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedReact, setCopiedReact] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [activeTab, setActiveTab] = useState('npm'); // npm | react | html | cdn

  const currentKey = projectKey || 'proj_live_test_9876543210';

  const copyToClipboard = (text, setFn) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const jsrInstallCmd = `npx jsr add @quantumva23/analytics-sdk`;
  const npmInstallCmd = `npm install @quantumva23/analytics-sdk`;

  const basicSnippet = `import Analytics from '@quantumva23/analytics-sdk';

// 1. Initialize once at app entry
Analytics.init({
  projectKey: '${currentKey}',
  flushInterval: 5000, // Debounced 5s batching
});

// 2. Track custom interactions anywhere
Analytics.track('button_clicked', {
  buttonId: 'btn_hero_signup',
  screen: 'home_landing',
});`;

  const reactSnippet = `import { useEffect } from 'react';
import Analytics from '@quantumva23/analytics-sdk';

export function useAnalytics() {
  useEffect(() => {
    Analytics.init({
      projectKey: '${currentKey}',
      flushInterval: 5000,
    });
  }, []);

  const trackEvent = (name, properties) => {
    Analytics.track(name, properties);
  };

  return { trackEvent };
}`;

  const htmlSnippet = `<!-- Embed in <head> or before </body> of any webpage -->
<script type="module">
  import Analytics from 'https://esm.sh/@quantumva23/analytics-sdk';

  Analytics.init({
    projectKey: '${currentKey}',
    flushInterval: 5000,
  });

  // Example button tracking
  document.querySelector('#cta-btn').addEventListener('click', () => {
    Analytics.track('cta_clicked', { section: 'header' });
  });
</script>`;

  return (
    <div className="space-y-8 animate-stream-item">
      {/* 1. Header & Live Package Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Code className="text-indigo-400" size={22} />
            SDK Integration & Embed Center
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Embed the published package into any React, Next.js, Vue, or vanilla HTML application with 2 lines of code.
          </p>
        </div>

        {/* Live Package Pill */}
        <a
          href="https://jsr.io/@quantumva23/analytics-sdk"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          jsr.io/@quantumva23/analytics-sdk <ExternalLink size={13} />
        </a>
      </div>

      {/* 2. Project Key Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono uppercase text-indigo-400 font-bold flex items-center gap-1.5">
              <Key size={14} /> Active Workspace Project Key
            </span>
            <p className="text-xs text-slate-400 mt-0.5">Include this key in your SDK configuration to isolate incoming events.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300">
            <span>{currentKey}</span>
            <button
              onClick={() => copyToClipboard(currentKey, setCopiedKey)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Code Snippet Tabs */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('npm')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'npm' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              JavaScript / TypeScript
            </button>
            <button
              onClick={() => setActiveTab('react')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'react' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              React / Next.js Hook
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'html' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vanilla HTML Script Tag
            </button>
          </div>

          <button
            onClick={() => {
              const toCopy = activeTab === 'npm' ? basicSnippet : activeTab === 'react' ? reactSnippet : htmlSnippet;
              copyToClipboard(toCopy, setCopiedSnippet);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-mono"
          >
            {copiedSnippet ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copiedSnippet ? 'Snippet Copied!' : 'Copy Code Snippet'}
          </button>
        </div>

        {/* Installation Command */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-400">Step 1: Install published package</span>
          <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200">
            <span className="text-indigo-400 font-bold">$ {jsrInstallCmd}</span>
            <button
              onClick={() => copyToClipboard(jsrInstallCmd, setCopiedNpm)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              {copiedNpm ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-400">Step 2: Initialize & track user behavior</span>
          <pre className="p-5 bg-slate-950 rounded-xl border border-slate-800 text-indigo-200 font-mono text-xs overflow-x-auto leading-relaxed">
            {activeTab === 'npm' && basicSnippet}
            {activeTab === 'react' && reactSnippet}
            {activeTab === 'html' && htmlSnippet}
          </pre>
        </div>
      </div>

      {/* 4. Architectural Highlights Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-mono uppercase">
            <Zap size={16} /> 5-Second Debounced Flush
          </div>
          <p className="text-xs text-slate-300">
            Events are cached in memory and batched to prevent overwhelming the browser network thread. Flushes instantly on page unload with <code className="text-indigo-300 font-mono">keepalive: true</code>.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono uppercase">
            <ShieldCheck size={16} /> Redis Sliding Rate Limit
          </div>
          <p className="text-xs text-slate-300">
            Ingestion endpoints enforce 100 req/sec limits per ProjectKey with atomic Redis counters, protecting the streaming pipeline against malicious DDoS spam.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono uppercase">
            <Layers size={16} /> Multi-Tenant Isolation
          </div>
          <p className="text-xs text-slate-300">
            Every project key routes to a distinct <code className="text-indigo-300 font-mono">workspaceId</code> compound index in ClickHouse, ensuring absolute data separation between applications.
          </p>
        </div>
      </div>
    </div>
  );
}
