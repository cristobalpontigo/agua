'use client';

import { ReactNode, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface MobileLoginGateProps {
  children: ReactNode;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AUTH_KEY = 'agua.auth';
const INSTALL_DISMISSED_KEY = 'agua.installPromptDismissed';

export function MobileLoginGate({ children }: MobileLoginGateProps) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed?.id && parsed?.name) {
          setUser(parsed);
          setIsAuthenticated(true);
        }
      }
    } finally {
      setCheckingAuth(false);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    const onAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jramirez@aguas.local', pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Error al iniciar sesión');
        return;
      }

      const authUser: AuthUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };

      setUser(authUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    } catch {
      setLoginError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUser(null);
    setPin('');
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const dismissInstallPrompt = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    setShowInstallPrompt(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <p className="mt-3 text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600 shadow-lg shadow-cyan-200">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AGUAS</h1>
            <p className="mt-1 text-sm text-slate-500">Gestión de ventas de agua</p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Usuario</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">jramirez</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">PIN de acceso</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setLoginError(null); }}
                  placeholder="Ingresa tu PIN"
                  maxLength={10}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-semibold tracking-[0.3em] text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100 transition"
                />
              </div>

              {loginError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-sm font-medium text-rose-700">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !pin}
                className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-cyan-200 transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'Verificando...' : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            AGUAS Gestión PYME &mdash; v1.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed right-3 top-3 z-[60] flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-700 shadow-sm backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="max-w-[140px] truncate font-medium">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-700"
        >
          Salir
        </button>
      </div>

      {showInstallPrompt && deferredPrompt && (
        <div className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-cyan-200 bg-white p-4 shadow-lg md:inset-x-auto md:right-4 md:w-[360px] md:bottom-4">
          <p className="text-sm font-semibold text-slate-900">Instalar AGUAS app</p>
          <p className="mt-1 text-xs text-slate-600">Agrégrala a tu pantalla de inicio para abrirla como aplicación móvil.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handleInstallApp}
              className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Instalar
            </button>
            <button
              onClick={dismissInstallPrompt}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
