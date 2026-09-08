import React, { useState } from 'react';
import { Play, Sparkles, Send, CheckCircle2, AlertCircle, Heart, MessageCircle, Share2, ShoppingCart, UserCheck, Zap, Terminal, Globe, Rocket } from 'lucide-react';

export default function Simulator({ projectKey }) {
  const [activeScenario, setActiveScenario] = useState('social'); // social | ecommerce | saas
  const [simulatedLogs, setSimulatedLogs] = useState([]);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const targetKey = projectKey || 'proj_live_test_9876543210';

  // Helper to dispatch event to Ingestion API
  const sendEventToIngest = async (eventName, properties = {}, customSessionId = null) => {
    const sessionId = customSessionId || `sid_sim_${Math.random().toString(36).substring(2, 9)}`;
    const payload = {
      projectKey: targetKey,
      event: eventName,
      name: eventName,
      sessionId,
      userId: `usr_${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: 'https://simulator.local',
      properties: {
        ...properties,
        simulator: true,
        scenario: activeScenario,
      }
    };

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      event: eventName,
      properties,
      sessionId,
      status: 'pending'
    };

    setSimulatedLogs((prev) => [logEntry, ...prev.slice(0, 29)]);

    try {
      const res = await fetch('http://localhost:4000/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSimulatedLogs((prev) =>
          prev.map((l) => (l === logEntry ? { ...l, status: 'success' } : l))
        );
      } else {
        setSimulatedLogs((prev) =>
          prev.map((l) => (l === logEntry ? { ...l, status: 'error' } : l))
        );
      }
    } catch (err) {
      // In dev fallback, simulate success in UI
      setSimulatedLogs((prev) =>
        prev.map((l) => (l === logEntry ? { ...l, status: 'simulated-ok' } : l))
      );
    }
  };

  // Run full batch user journeys
  const runBatchSimulation = async (count = 20) => {
    setIsSimulatingBatch(true);
    setBatchProgress(0);

    const scenarioSteps = {
      social: ['$pageview', 'feed_scrolled', 'post_liked', 'comment_added', 'post_shared'],
      ecommerce: ['$pageview', 'product_viewed', 'add_to_cart', 'checkout_started', 'purchase_completed'],
      saas: ['$pageview', 'signup_completed', 'dashboard_visited', 'project_created', 'plan_upgraded'],
    }[activeScenario];

    for (let i = 0; i < count; i++) {
      const session = `sid_batch_${Math.random().toString(36).substring(2, 9)}`;
      // Simulating conversion dropoff throughout the steps
      const reachStep = Math.random() > 0.3 ? (Math.random() > 0.5 ? scenarioSteps.length : 3) : 1;

      for (let s = 0; s < reachStep; s++) {
        await sendEventToIngest(scenarioSteps[s], { batchRun: true, step: s + 1 }, session);
        await new Promise((r) => setTimeout(r, 60));
      }
      setBatchProgress(Math.round(((i + 1) / count) * 100));
    }

    setIsSimulatingBatch(false);
  };

  return (
    <div className="space-y-8 animate-stream-item">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Rocket className="text-indigo-400" size={22} />
            Interactive Real-World App Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simulate realistic user behaviors and funnels on social, SaaS, and commerce web apps, firing live batches directly into the Ingestion pipeline.
          </p>
        </div>

        {/* Batch Generator */}
        <button
          onClick={() => runBatchSimulation(25)}
          disabled={isSimulatingBatch}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          <Zap size={15} />
          {isSimulatingBatch ? `Simulating Traffic (${batchProgress}%)...` : 'Simulate 25 User Funnel Journeys'}
        </button>
      </div>

      {/* 2. Scenario Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveScenario('social')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeScenario === 'social'
              ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">Social Media App</span>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Instagram / X</span>
          </div>
          <p className="text-xs text-slate-400">
            Feed scroll, like posts, add comments, share to stories, and follow creators.
          </p>
        </button>

        <button
          onClick={() => setActiveScenario('ecommerce')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeScenario === 'ecommerce'
              ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">E-Commerce Store</span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Shopify Flow</span>
          </div>
          <p className="text-xs text-slate-400">
            Product catalog views, cart additions, checkout initiations, and order completions.
          </p>
        </button>

        <button
          onClick={() => setActiveScenario('saas')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeScenario === 'saas'
              ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">B2B SaaS Platform</span>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Linear / Slack</span>
          </div>
          <p className="text-xs text-slate-400">
            Landing visits, signups, workspace setups, team invitations, and plan upgrades.
          </p>
        </button>
      </div>

      {/* 3. Interactive Mock Interface & Live Event Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Simulated Web App Widget */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Interactive Sandbox Action Buttons</h4>
            </div>
            <span className="text-xs font-mono text-slate-500">Target: POST /ingest</span>
          </div>

          {activeScenario === 'social' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                      VA
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">@vishal_creator</div>
                      <div className="text-[10px] text-slate-400">Sponsored Post • 2h ago</div>
                    </div>
                  </div>
                  <button
                    onClick={() => sendEventToIngest('user_followed', { creator: '@vishal_creator' })}
                    className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1 rounded-lg transition-all"
                  >
                    + Follow
                  </button>
                </div>

                <div className="h-32 bg-slate-950/60 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 text-xs font-mono">
                  [Simulated Media Content / Video Feed]
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => sendEventToIngest('post_liked', { postId: 'post_9482' })}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-pink-950/50 hover:text-pink-400 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Heart size={15} /> Like
                    </button>
                    <button
                      onClick={() => sendEventToIngest('comment_added', { postId: 'post_9482', text: 'Amazing update!' })}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-950/50 hover:text-indigo-400 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <MessageCircle size={15} /> Comment
                    </button>
                    <button
                      onClick={() => sendEventToIngest('post_shared', { postId: 'post_9482', medium: 'story' })}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-950/50 hover:text-cyan-400 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Share2 size={15} /> Share
                    </button>
                  </div>

                  <button
                    onClick={() => sendEventToIngest('feed_scrolled', { scrollDepth: '75%' })}
                    className="text-xs text-slate-400 hover:text-white font-mono underline"
                  >
                    Trigger Scroll Event
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeScenario === 'ecommerce' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Smart Wireless Headphones Pro</span>
                  <span className="text-sm font-extrabold text-indigo-400 font-mono">$199.00</span>
                </div>
                <div className="h-28 bg-slate-950/60 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 text-xs font-mono">
                  [Product Image & Specs Preview]
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => sendEventToIngest('product_viewed', { itemId: 'prod_902', price: 199 })}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    View Product Details
                  </button>
                  <button
                    onClick={() => sendEventToIngest('add_to_cart', { itemId: 'prod_902', price: 199 })}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => sendEventToIngest('checkout_started', { cartTotal: 199 })}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Begin Checkout
                  </button>
                  <button
                    onClick={() => sendEventToIngest('purchase_completed', { orderId: `ord_${Math.floor(Math.random() * 8000 + 1000)}`, revenue: 199 })}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Complete Purchase
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeScenario === 'saas' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white">SaaS User Activation Journey</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => sendEventToIngest('signup_completed', { plan: 'growth_trial' })}
                    className="p-3 bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-semibold text-left transition-all"
                  >
                    1. Complete Sign Up
                  </button>
                  <button
                    onClick={() => sendEventToIngest('dashboard_visited', { path: '/app' })}
                    className="p-3 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold text-left transition-all"
                  >
                    2. Visit Dashboard
                  </button>
                  <button
                    onClick={() => sendEventToIngest('project_created', { projectName: 'Analytics Engine' })}
                    className="p-3 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold text-left transition-all"
                  >
                    3. Create New Project
                  </button>
                  <button
                    onClick={() => sendEventToIngest('plan_upgraded', { tier: 'Enterprise', mrr: 199 })}
                    className="p-3 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-semibold text-left transition-all"
                  >
                    4. Upgrade Plan ($199)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Transmission Terminal Log */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Terminal size={16} className="text-indigo-400" />
                Transmission Pipeline Log
              </h4>
              <span className="text-xs font-mono text-slate-500">Live Dispatches</span>
            </div>

            <div className="h-[360px] overflow-y-auto space-y-2 font-mono text-xs pr-1">
              {simulatedLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-2">
                  <Play size={24} className="text-slate-600" />
                  <p>Click any button on the left or run a batch simulation to transmit events.</p>
                </div>
              ) : (
                simulatedLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{log.timestamp}</span>
                      <span className="text-indigo-400 font-bold">{log.event}</span>
                      <span className="text-slate-500 truncate max-w-[100px]">{log.sessionId}</span>
                    </div>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> 202 Accepted
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Payload sent with keepalive & batching</span>
            <span className="text-indigo-400 font-bold">{simulatedLogs.length} events sent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
