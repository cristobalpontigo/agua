'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
  notified: boolean;
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
}

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  normal: { label: 'Normal', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  high: { label: 'Alta', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function RemindersPanel() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notifCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch(`/api/reminders?completed=${showCompleted}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch {
      console.error('Error al cargar recordatorios');
    } finally {
      setLoading(false);
    }
  }, [showCompleted]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Notification checker — runs every 30 seconds
  useEffect(() => {
    const checkAndNotify = () => {
      const now = new Date();
      reminders.forEach(async (r) => {
        if (r.completed || r.notified) return;
        const due = new Date(r.dueDate);
        const diffMs = due.getTime() - now.getTime();
        // Notify if due within the next 2 minutes or already past
        if (diffMs <= 120_000) {
          if ('Notification' in window && Notification.permission === 'granted') {
            const prLabel = PRIORITY_CONFIG[r.priority]?.label || '';
            new Notification(`⏰ Recordatorio: ${r.title}`, {
              body: r.description || `Prioridad: ${prLabel}`,
              icon: '/icon',
              tag: r.id,
            });
          }
          // Mark as notified
          try {
            await fetch(`/api/reminders/${r.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notified: true }),
            });
            setReminders((prev) =>
              prev.map((rem) => (rem.id === r.id ? { ...rem, notified: true } : rem))
            );
          } catch { /* ignore */ }
        }
      });
    };

    notifCheckRef.current = setInterval(checkAndNotify, 30_000);
    checkAndNotify(); // run immediately

    return () => {
      if (notifCheckRef.current) clearInterval(notifCheckRef.current);
    };
  }, [reminders]);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('09:00');
    setPriority('normal');
    setSubmitError(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim()) { setSubmitError('El título es requerido'); return; }
    if (!dueDate) { setSubmitError('La fecha es requerida'); return; }

    setIsSubmitting(true);
    try {
      const fullDate = `${dueDate}T${dueTime}:00`;

      if (editingId) {
        const res = await fetch(`/api/reminders/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, dueDate: fullDate, priority }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setSubmitError(d.error || 'Error al actualizar');
          return;
        }
      } else {
        const res = await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, dueDate: fullDate, priority }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setSubmitError(d.error || 'Error al crear');
          return;
        }
      }

      resetForm();
      setShowForm(false);
      await fetchReminders();
    } catch {
      setSubmitError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (r: Reminder) => {
    try {
      await fetch(`/api/reminders/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !r.completed }),
      });
      await fetchReminders();
    } catch { /* ignore */ }
  };

  const deleteReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      await fetchReminders();
    } catch { /* ignore */ }
  };

  const startEdit = (r: Reminder) => {
    const d = new Date(r.dueDate);
    setTitle(r.title);
    setDescription(r.description || '');
    setDueDate(d.toISOString().slice(0, 10));
    setDueTime(d.toTimeString().slice(0, 5));
    setPriority(r.priority);
    setEditingId(r.id);
    setShowForm(true);
    setSubmitError(null);
  };

  const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return `Hoy ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (d.toDateString() === tomorrow.toDateString()) {
      return `Mañana ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('es-CL', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const pendingCount = reminders.filter((r) => !r.completed).length;
  const overdueCount = reminders.filter((r) => !r.completed && isOverdue(r.dueDate)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Recordatorios</h3>
          <p className="text-sm text-slate-500">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            {overdueCount > 0 && (
              <span className="ml-2 text-rose-600 font-medium">
                ({overdueCount} vencido{overdueCount !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {notifPermission !== 'granted' && (
            <button
              onClick={requestNotifications}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              🔔 Activar notificaciones
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            {showForm ? 'Cancelar' : '+ Nuevo'}
          </button>
        </div>
      </div>

      {/* Notification status */}
      {notifPermission === 'granted' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <span>🔔</span> Notificaciones activadas — recibirás alertas cuando se cumpla la fecha.
        </div>
      )}
      {notifPermission === 'denied' && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <span>🔕</span> Notificaciones bloqueadas. Habilítalas en la configuración del navegador.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {editingId ? 'Editar recordatorio' : 'Nuevo recordatorio'}
          </p>

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué necesitas recordar?"
              maxLength={200}
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas adicionales (opcional)"
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Hora</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none"
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear recordatorio'}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCompleted(false)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            !showCompleted ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setShowCompleted(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            showCompleted ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Cargando recordatorios...</div>
      ) : reminders.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl">📋</p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {showCompleted ? 'No hay recordatorios aún' : 'Sin recordatorios pendientes'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Crea uno para no olvidar nada importante.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => {
            const overdue = !r.completed && isOverdue(r.dueDate);
            const pConfig = PRIORITY_CONFIG[r.priority];
            return (
              <div
                key={r.id}
                className={`group rounded-xl border p-3 transition ${
                  r.completed
                    ? 'border-slate-100 bg-slate-50 opacity-60'
                    : overdue
                      ? 'border-rose-200 bg-rose-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(r)}
                    className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                      r.completed
                        ? 'border-emerald-400 bg-emerald-400 text-white'
                        : 'border-slate-300 active:border-cyan-400'
                    }`}
                  >
                    {r.completed && <span className="text-xs">✓</span>}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${r.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {r.title}
                    </p>
                    {r.description && (
                      <p className={`mt-0.5 text-xs ${r.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                        {r.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-medium ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                        {overdue ? '⚠ ' : '🕐 '}
                        {formatDate(r.dueDate)}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pConfig.color}`}>
                        {pConfig.label}
                      </span>
                      {r.notified && !r.completed && (
                        <span className="text-[10px] text-amber-600 font-medium">🔔 Notificado</span>
                      )}
                    </div>
                  </div>

                  {/* Actions — always visible for touch */}
                  <div className="flex gap-1">
                    {!r.completed && (
                      <button
                        onClick={() => startEdit(r)}
                        className="rounded-lg p-2 text-sm text-slate-500 active:bg-slate-100 bg-slate-50"
                        title="Editar"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="rounded-lg p-2 text-sm text-rose-500 active:bg-rose-50 bg-slate-50"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
