import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import {AuthProvider} from './contexts/AuthContext';
import {CartProvider} from './contexts/CartContext';
import {NotificationProvider} from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';

// Global DOM Shield to prevent removeChild / insertBefore crashes from browsers, extensions (like translation engines) or React concurrent reconciliator
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (this && child) {
      if (this.contains(child)) {
        try {
          return originalRemoveChild.call(this, child);
        } catch (err) {
          console.warn('[Global DOM Shield] Ignorado erro capturado no removeChild:', err);
          return child;
        }
      } else {
        console.warn('[Global DOM Shield] Tentativa de remover um nó que não pertence a este pai:', { parent: this, child });
        return child;
      }
    }
    return child;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && !this.contains(referenceNode)) {
      console.warn('[Global DOM Shield] Nó de referência provido não é descendente direto do elemento pai. Realizando append como fallback:', { parent: this, newNode, referenceNode });
      try {
        this.appendChild(newNode);
        return newNode;
      } catch (err) {
        console.warn('[Global DOM Shield] Fallback do appendChild mal sucedido:', err);
        return newNode;
      }
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (err) {
      console.warn('[Global DOM Shield] Ignorado erro capturado no insertBefore:', err);
      return newNode;
    }
  };
}

// Safe Logger utility helper
const log = (msg: string, type: 'info' | 'error' = 'info') => {
  if (typeof window !== 'undefined' && (window as any).__startup_log) {
    (window as any).__startup_log(`[BUNDLE] ${msg}`, type);
  } else {
    console.log(`[BUNDLE] ${msg}`);
  }
};

log('Initializing main.tsx bundle execution');

// Register the Service Worker and clear old cache if needed for complete PWA compliance
if (typeof window !== 'undefined') {
  log(`Reading environment variables... PROD: ${(import.meta as any).env.PROD}`);
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        log('Service Worker registered successfully with scope: ' + reg.scope);
      })
      .catch((err) => {
        console.warn('[ServiceWorker] Main bundle registration failed:', err);
      });
  }

  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key).then(() => {
          log(`Cleared legacy cache: ${key}`);
        });
      });
    }).catch((err) => {
      console.warn('[Cache] Failed to clear legacy caches:', err);
    });
  }
}

log('Mounting React application to DOM #root element');

const rootElement = document.getElementById('root');
if (!rootElement) {
  log('FATAL: Root element with ID "root" was not found in the DOM', 'error');
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
    log('React render loop initiated successfully');
  } catch (renderError: any) {
    log(`FATAL: React render throw exception: ${renderError.message || renderError}`, 'error');
  }
}

