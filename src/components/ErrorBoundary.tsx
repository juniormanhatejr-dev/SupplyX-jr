import React, { ErrorInfo, ReactNode } from 'react';
import { Shield, AlertOctagon, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('%c[REACT ERROR BOUNDARY] CRITICAL ERROR INTERCEPTED', 'background: #fee2e2; color: #ef4444; font-weight: bold; padding: 4px; border-radius: 4px;');
    console.error('Error Object:', error);
    console.error('Component Stack Trace:', errorInfo.componentStack);
    console.groupEnd();
    
    this.setState({ errorInfo });
    
    // Attempt tracking in browser local storage or global logs for debugging
    if (typeof window !== 'undefined') {
      try {
        const errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          time: new Date().toISOString()
        };
        window.localStorage.setItem('supplyx_last_react_error', JSON.stringify(errorDetails));
      } catch (storageErr) {
        console.warn('Failed to write error to localStorage:', storageErr);
      }
    }
  }

  private handleReset = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('supplyx_last_react_error');
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const language = (typeof window !== 'undefined' && window.localStorage.getItem('supplyx_language') as 'PT' | 'EN') || 'PT';
      const prompt = {
        PT: {
          unknownError: 'Erro desconhecido.',
          title: 'Crash Detectado — Error Boundary',
          subtitle: 'O SupplyX encontrou um erro no nível de componente React e impediu o encerramento do app.',
          errorMessage: 'MENSAGEM DE ERRO:',
          stackTrace: 'PILHA DE CHAMADAS (STACK TRACE):',
          buttonReset: 'Limpar Cache e Recarregar'
        },
        EN: {
          unknownError: 'Unknown error.',
          title: 'Crash Detected — Error Boundary',
          subtitle: 'SupplyX encountered an error in a React component and prevented the application from crashing completely.',
          errorMessage: 'ERROR MESSAGE:',
          stackTrace: 'CALL STACK (STACK TRACE):',
          buttonReset: 'Clear Cache & Reload'
        }
      }[language];

      const errorMsg = this.state.error?.message || prompt.unknownError;
      const errorStack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen bg-[#0B0F14] text-slate-200 flex flex-col justify-center items-center p-6 font-sans select-none relative overflow-hidden">
          {/* Background Ambient lights */}
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-red-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-red-500/5 blur-[120px] rounded-full" />

          <div className="w-full max-w-2xl bg-[#111827] border border-red-500/20 rounded-2xl p-6 sm:p-10 shadow-2xl relative z-10 space-y-6">
            <div className="flex items-center gap-4 border-b border-red-500/10 pb-4">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-wider text-red-400">{prompt.title}</h1>
                <p className="text-xs text-slate-400 font-medium">{prompt.subtitle}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#161F2B] border border-red-500/10 p-4 rounded-xl">
                <h3 className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {prompt.errorMessage}
                </h3>
                <p className="text-xs text-amber-200 font-mono select-text bg-black/30 p-2 rounded border border-white/5 break-all">
                  {errorMsg}
                </p>
              </div>

              {(errorStack || componentStack) && (
                <div className="bg-[#161F2B] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 font-mono">{prompt.stackTrace} {language === 'PT' ? 'PILHA DE CHAMADAS (STACK TRACE):' : 'CALL STACK:'}</h3>
                  <div className="max-h-48 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-2 select-text bg-black/40 p-3 rounded border border-white/5 custom-scrollbar">
                    {errorStack && (
                      <div>
                        <p className="font-extrabold text-[#3B82F6] mb-1">Stack Trace:</p>
                        <pre className="whitespace-pre-wrap break-all">{errorStack}</pre>
                      </div>
                    )}
                    {componentStack && (
                      <div className="border-t border-white/5 pt-2 mt-2">
                        <p className="font-extrabold text-[#F59E0B] mb-1">Component Stack:</p>
                        <pre className="whitespace-pre-wrap break-all">{componentStack}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-end">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 h-11 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                {prompt.buttonReset}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
