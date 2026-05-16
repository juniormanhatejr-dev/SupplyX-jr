import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, Shield, User, Globe, Server, CheckCircle2, XCircle } from 'lucide-react';
import { auth, db, rtdb } from '../lib/firebase';

const DiagnosticOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({
    firestore: 'testing',
    rtdb: 'testing',
    auth: 'testing',
    network: navigator.onLine ? 'online' : 'offline'
  });

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const logQueue: any[] = [];
    let flushTimeout: any = null;

    const flushLogs = () => {
      if (logQueue.length > 0) {
        setHistory(prev => [...logQueue, ...prev].slice(0, 30));
        logQueue.length = 0;
      }
      flushTimeout = null;
    };

    const queueLog = (msg: string, type: string) => {
      logQueue.unshift({ time: new Date().toLocaleTimeString(), msg, type });
      if (!flushTimeout) {
        flushTimeout = setTimeout(flushLogs, 200);
      }
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      if (msg.includes('[Presence FAILURE]') || msg.includes('PermissionDenied') || msg.includes('insufficient permissions')) {
        queueLog(msg, 'error');
      }
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      queueLog(msg, 'warn');
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      if (flushTimeout) clearTimeout(flushTimeout);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus({
        firestore: !!db ? 'ready' : 'failed',
        rtdb: !!rtdb ? 'ready' : 'not_init',
        auth: !!auth.currentUser ? 'logged_in' : 'anonymous',
        network: navigator.onLine ? 'online' : 'offline',
        uid: auth.currentUser?.uid || 'none'
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-red-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Diagnostic Tool"
      >
        <AlertTriangle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-800">
          <h2 className="text-white text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            EXTREME FIREBASE DIAGNOSTIC v2.0
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Network</span>
              </div>
              <p className={`text-xs font-bold ${status.network === 'online' ? 'text-green-500' : 'text-red-500'}`}>{status.network.toUpperCase()}</p>
            </div>
            <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Auth State</span>
              </div>
              <p className={`text-xs font-bold ${status.auth === 'logged_in' ? 'text-green-500' : 'text-yellow-500'}`}>{status.auth.toUpperCase()}</p>
            </div>
            <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] text-zinc-400 uppercase font-bold">User UID</span>
              </div>
              <p className="text-[9px] font-bold text-zinc-300 truncate">{status.uid}</p>
            </div>
            <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Engine</span>
              </div>
              <p className="text-xs font-bold text-green-500 italic">LIVE</p>
            </div>
          </div>

          {/* Error Log */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Live Error Feed (Last 20)</h3>
            <div className="bg-black/50 rounded-xl p-4 h-64 overflow-y-auto border border-zinc-800 space-y-2">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 italic text-xs">
                  No errors detected in current session.
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className={`text-[10px] leading-relaxed p-2 rounded border-l-2 ${
                    h.type === 'error' ? 'bg-red-500/5 border-red-500 text-red-400' : 'bg-yellow-500/5 border-yellow-500 text-yellow-400'
                  }`}>
                    <span className="opacity-50 mr-2">[{h.time}]</span>
                    {h.msg}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
            <h3 className="text-[10px] font-black uppercase text-blue-400 mb-2">Diagnostic Advice</h3>
            <ul className="text-[10px] text-blue-200/70 space-y-1 list-disc pl-4">
              <li>If <b>Permission Denied</b> loops: Check Firebase Console Rules vs your logic.</li>
              <li>Check if <b>updatedAt</b> is sent in Firestore writes.</li>
              <li>Verify if <b>Realtime Database</b> is enabled for your project region.</li>
              <li>Ensure <b>Storage</b> public read is restricted if needed.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticOverlay;
