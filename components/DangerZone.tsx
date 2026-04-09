'use client';

import { useState } from 'react';

export function DangerZone() {
  const [step, setStep] = useState<'idle' | 'confirm1' | 'confirm2' | 'deleting' | 'done'>('idle');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agua_backup_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el respaldo.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setStep('deleting');
    setError(null);
    try {
      const res = await fetch('/api/reset', { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setStep('done');
      // Reload after short delay to reflect empty state
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setError('Error al eliminar los datos.');
      setStep('idle');
    }
  };

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-500">Zona peligrosa</p>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={downloading}
          className="mt-2 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {downloading ? 'Descargando...' : '📥 Descargar respaldo (CSV)'}
        </button>

        {/* Delete flow */}
        {step === 'idle' && (
          <button
            onClick={() => setStep('confirm1')}
            className="mt-2 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            🗑️ Borrar todos los datos
          </button>
        )}

        {step === 'confirm1' && (
          <div className="mt-2 rounded-lg border border-rose-300 bg-rose-100 p-3 space-y-2">
            <p className="text-xs font-bold text-rose-900">⚠️ ¿Estás seguro?</p>
            <p className="text-[11px] text-rose-700">
              Se eliminarán <strong>todos</strong> los clientes, ventas, pagos, entregas, productos, recordatorios y registros de facturación. Esta acción NO se puede deshacer.
            </p>
            <p className="text-[11px] text-rose-700 font-semibold">
              Recomendación: Descarga un respaldo antes de continuar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('idle')}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep('confirm2')}
                className="flex-1 rounded-lg border border-rose-400 bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                Sí, continuar
              </button>
            </div>
          </div>
        )}

        {step === 'confirm2' && (
          <div className="mt-2 rounded-lg border-2 border-rose-500 bg-rose-200 p-3 space-y-2">
            <p className="text-sm font-bold text-rose-900">🚨 ÚLTIMA ADVERTENCIA</p>
            <p className="text-xs text-rose-800">
              Todos los datos serán eliminados permanentemente. No hay vuelta atrás.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('idle')}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-800 animate-pulse"
              >
                ELIMINAR TODO
              </button>
            </div>
          </div>
        )}

        {step === 'deleting' && (
          <div className="mt-2 rounded-lg border border-rose-300 bg-rose-100 p-3 text-center">
            <p className="text-xs text-rose-700 font-semibold">Eliminando datos...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-center">
            <p className="text-xs text-emerald-800 font-semibold">✅ Datos eliminados. Recargando...</p>
          </div>
        )}

        {error && (
          <div className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
