'use client';

import { ReactNode, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface MobileLoginGateProps {
  children: ReactNode;
}

const AUTH_KEY = 'agua.simpleAuth';
const INSTALL_DISMISSED_KEY = 'agua.installPromptDismissed';

export function MobileLoginGate({ children }: MobileLoginGateProps) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { name?: string; remember?: boolean };
        if (parsed?.name) {
          setDisplayName(parsed.name);
          setIsAuthenticated(true);
        }
      }
    } finally {
      setCheckingAuth(false);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail to avoid blocking usage.
      });
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

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setLoginError('Ingresa tu nombre para continuar.');
      return;
    }

    if (pin && pin.length < 4) {
      setLoginError('Si usas PIN, debe tener al menos 4 digitos.');
      return;
    }

    setLoginError(null);
    setDisplayName(trimmedName);
    setIsAuthenticated(true);

    if (rememberMe) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ name: trimmedName, remember: true }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setName('');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white px-4 py-8">
        <div className="mx-auto max-w-md rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Acceso rapido</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">AGUAS en movil</h1>
          <p className="mt-1 text-sm text-slate-600">Login ultra simple para entrar al panel.</p>

          <form className="mt-5 space-y-3" onSubmit={handleLogin}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Daniela"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">PIN (opcional)</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4+ digitos"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Recordarme en este equipo
            </label>

            {loginError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 font-semibold text-white transition hover:bg-cyan-700"
            >
              Entrar
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-500">Despues de entrar podras instalarla como app desde el prompt.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed right-3 top-3 z-[60] flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-700 shadow-sm backdrop-blur">
        <span className="max-w-[110px] truncate">{displayName}</span>
        <button
          onClick={handleLogout}
          className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white"
        >
          Salir
        </button>
      </div>

      {showInstallPrompt && deferredPrompt && (
        <div className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-cyan-200 bg-white p-4 shadow-lg md:inset-x-auto md:right-4 md:w-[360px] md:bottom-4">
          <p className="text-sm font-semibold text-slate-900">Instalar AGUAS app</p>
          <p className="mt-1 text-xs text-slate-600">Agregala a tu pantalla de inicio para abrirla como aplicacion movil.</p>
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
