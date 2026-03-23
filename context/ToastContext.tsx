/**
 * NOTIFICACIONES - Sistema de feedback al usuario
 * Toast notifications para acciones, errores, éxitos
 */

'use client';

import React, { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = `toast_${Date.now()}`;
    const newToast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}

// Componente para mostrar notificaciones
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-600 border-green-400';
      case 'error': return 'bg-red-600 border-red-400';
      case 'warning': return 'bg-orange-600 border-orange-400';
      case 'info': return 'bg-blue-600 border-blue-400';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
    }
  };

  return (
    <div className="fixed top-6 right-6 space-y-2 z-50 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${getColor(toast.type)} text-white p-4 rounded-lg shadow-lg border-l-4 flex items-center justify-between gap-3 animate-slide-in `}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{getIcon(toast.type)}</span>
            <p className="font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-lg hover:opacity-75 transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
