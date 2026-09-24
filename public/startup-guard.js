(function() {
  window.__startup_logs = [{ time: new Date().toLocaleTimeString(), msg: '[HTML] Loading application resources', type: 'info' }];
  window.__startup_errors = [];
  
  function log(message, type = 'info') {
    const entry = { time: new Date().toLocaleTimeString(), msg: message, type };
    window.__startup_logs.push(entry);
    console.log(`%c${entry.time} ${entry.msg}`, type === 'error' ? 'font-weight: bold; color: #f87171;' : 'color: #94a3b8;');
  }
  
  window.__startup_log = log;

  window.onerror = function(message, source, lineno, colno, error) {
    const detail = {
      message: message,
      source: source,
      lineno: lineno,
      colno: colno,
      stack: error ? error.stack : '',
      time: new Date().toLocaleTimeString()
    };
    window.__startup_errors.push(detail);
    log(`[APPLICATION EXCEPTION] Error: ${message} in ${source}:${lineno}:${colno}`, 'error');
    showCrashScreen(detail);
    return false;
  };

  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    const detail = {
      message: reason ? (reason.message || String(reason)) : 'Rejected Promise',
      source: 'Promise Rejection',
      lineno: 0,
      colno: 0,
      stack: reason ? (reason.stack || '') : '',
      time: new Date().toLocaleTimeString()
    };
    window.__startup_errors.push(detail);
    log(`[APPLICATION REJECTION] Reason: ${detail.message}`, 'error');
    showCrashScreen(detail);
  });

  function showCrashScreen(err) {
    setTimeout(function() {
      const rootEl = document.getElementById('root');
      if (rootEl && rootEl.children.length > 0) {
        log('[HTML] Application running successfully. Suppressing fallback.');
        return;
      }
      if (document.getElementById('startup-crash-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'startup-crash-overlay';
      overlay.style.cssText = 'position: fixed; inset: 0; z-index: 999999; background: #0B0F14; padding: 24px; color: #f1f5f9; font-family: monospace; font-size: 11px; line-height: 1.6; overflow-y: auto;';
      
      overlay.innerHTML = `
        <div style="max-w: 640px; margin: 40px auto; background: #111827; border: 1px solid #ef444430; padding: 24px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #ef444420; padding-bottom: 16px; margin-bottom: 16px;">
            <span style="font-size: 24px;">🚫</span>
            <div>
              <h3 style="margin: 0; font-size: 13px; font-weight: 900; color: #f87171; text-transform: uppercase;">Aviso de Inicialização</h3>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 10px;">O navegador detectou uma falha durante o carregamento.</p>
            </div>
          </div>
          
          <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <strong style="color: #f87171; display: block; margin-bottom: 4px;">Mensagem de erro:</strong>
            <span style="color: #fca5a5; word-break: break-all;">${err.message || 'Erro Desconhecido'}</span>
          </div>

          <div style="margin-bottom: 16px;">
            <strong style="color: #94a3b8; display: block; margin-bottom: 4px;">Pilha de Execução:</strong>
            <pre style="background: rgba(0,0,0,0.3); border: 1px solid #ffffff10; border-radius: 6px; padding: 12px; margin: 0; overflow-x: auto; white-space: pre-wrap; word-break: break-all; color: #cbd5e1; max-height: 250px;">${err.stack || 'Sem stack disponível'}</pre>
          </div>

          <div style="margin-bottom: 16px; color: #94a3b8; font-size: 10px;">
            <strong>Origem:</strong> ${err.source || 'Desconhecida'} (Linha: ${err.lineno || 'N/A'}, Col: ${err.colno || 'N/A'})
          </div>

          <div style="border-top: 1px solid #374151; padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
            <button onclick="window.location.reload(true)" style="background: #ef4444; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: monospace; font-size: 10px; font-weight: bold; text-transform: uppercase;">Recarregar Página</button>
            <span style="color: #4b5563; font-size: 9px;">SupplyX Runtime</span>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }, 1500);
  }

  window.addEventListener('DOMContentLoaded', function() {
    log('[HTML] DOMContentLoaded — Estrutura carregada com sucesso');
  });

  window.addEventListener('load', function() {
    log('[HTML] Load completo — Recursos estáticos finalizados');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function(err) {
        console.warn('SW registration:', err);
      });
    }
  });
})();
