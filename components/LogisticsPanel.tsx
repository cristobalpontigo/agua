'use client';

import { useMemo, useState } from 'react';
import { Sale } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';

interface LogisticsPanelProps {
  sales: Sale[];
  onUpdated: () => Promise<void>;
}

type DeliveryStatusFilter = 'all' | 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'missing' | 'overdue';

function getDeliveryStatusLabel(status?: string) {
  switch (status) {
    case 'scheduled':
      return 'Programada';
    case 'in_transit':
      return 'Despachada';
    case 'delivered':
      return 'Entregada';
    case 'failed':
      return 'No entregada';
    default:
      return 'Sin programar';
  }
}

function getDeliveryStatusClasses(status?: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_transit':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'failed':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getCardPriorityClasses(
  status: string | undefined,
  scheduled: Date | null,
  startToday: Date,
  endToday: Date
) {
  if (status === 'delivered') return 'border-emerald-200 bg-emerald-50/30';
  if (status === 'failed') return 'border-rose-300 bg-rose-50';
  if (scheduled && scheduled < startToday && status !== 'delivered') return 'border-red-400 bg-red-50';
  if (scheduled && scheduled >= startToday && scheduled < endToday) return 'border-amber-400 bg-amber-50';
  if (scheduled && scheduled >= endToday) return 'border-blue-300 bg-blue-50/40';
  return 'border-slate-200 bg-white';
}

export function LogisticsPanel({ sales, onUpdated }: LogisticsPanelProps) {
  const [filter, setFilter] = useState<DeliveryStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBySector, setGroupBySector] = useState(false);
  const [driverMode, setDriverMode] = useState(false);
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [loadingSaleId, setLoadingSaleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const enrichedSales = useMemo(() => {
    return sales
      .map((sale) => {
        const delivery = (sale as any).delivery;
        const scheduled = delivery?.scheduledDate ? new Date(delivery.scheduledDate) : null;
        return {
          ...sale,
          clientLabel: sale.clientName || sale.client?.name || sale.clientId,
          delivery,
          scheduled,
          total: SaleService.calculateTotal(sale.items),
        };
      })
      .sort((a, b) => {
        if (!a.scheduled && !b.scheduled) return 0;
        if (!a.scheduled) return 1;
        if (!b.scheduled) return -1;
        return a.scheduled.getTime() - b.scheduled.getTime();
      });
  }, [sales]);

  const filteredSales = enrichedSales.filter((sale) => {
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      const haystack = [
        sale.clientLabel,
        sale.client?.contactName,
        sale.client?.phone,
        sale.client?.address,
        sale.client?.sector,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    const status = sale.delivery?.status;
    if (filter === 'all') return true;
    if (filter === 'missing') return !status;
    if (filter === 'overdue') {
      if (!sale.scheduled) return false;
      return sale.scheduled < startToday && status !== 'delivered';
    }
    if (filter === 'failed') return status === 'failed';
    if (filter === 'delivered') return status === 'delivered';
    if (filter === 'scheduled') return status === 'scheduled';
    if (filter === 'in_transit') return status === 'in_transit';
    return status === filter;
  });

  const groupedSales = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const key = sale.client?.sector || 'sin_sector';
      if (!acc[key]) acc[key] = [];
      acc[key].push(sale);
      return acc;
    }, {} as Record<string, typeof filteredSales>);
  }, [filteredSales]);

  const overdueCount = enrichedSales.filter((sale) => {
    if (!sale.scheduled) return false;
    const status = sale.delivery?.status;
    return sale.scheduled < startToday && status !== 'delivered';
  }).length;

  const deliveredSales = enrichedSales.filter((sale) => sale.delivery?.status === 'delivered');
  const onTimeDeliveredCount = deliveredSales.filter((sale) => {
    if (!sale.delivery?.scheduledDate || !sale.delivery?.completedAt) return false;
    return new Date(sale.delivery.completedAt).getTime() <= new Date(sale.delivery.scheduledDate).getTime();
  }).length;
  const onTimeRate = deliveredSales.length > 0
    ? Math.round((onTimeDeliveredCount / deliveredSales.length) * 100)
    : 0;

  const todayCount = enrichedSales.filter((sale) => {
    if (!sale.scheduled) return false;
    return sale.scheduled >= startToday && sale.scheduled < endToday;
  }).length;

  const pendingCount = enrichedSales.filter((sale) => {
    const status = sale.delivery?.status;
    return status === 'scheduled' || status === 'in_transit' || !status;
  }).length;

  const rescheduleToTomorrow = async (saleId: string) => {
    setActionError(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isoDate = tomorrow.toISOString().split('T')[0];
    setDateDrafts((prev) => ({ ...prev, [saleId]: isoDate }));
    setLoadingSaleId(saleId);
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery: {
            status: 'scheduled',
            scheduledDate: new Date(`${isoDate}T09:00:00`).toISOString(),
          },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo reprogramar');
      }
      await onUpdated();
    } catch (error: any) {
      setActionError(error.message || 'Error al reprogramar');
    } finally {
      setLoadingSaleId(null);
    }
  };

  const markStatus = async (saleId: string, status: 'scheduled' | 'in_transit' | 'delivered' | 'failed') => {
    setActionError(null);
    setLoadingSaleId(saleId);

    try {
      const currentDraftDate = dateDrafts[saleId];
      const body: any = {
        delivery: {
          status,
        },
      };

      if (currentDraftDate) {
        body.delivery.scheduledDate = new Date(`${currentDraftDate}T09:00:00`).toISOString();
      }

      const currentNote = (noteDrafts[saleId] || '').trim();
      if (status === 'failed' && !currentNote && !driverMode) {
        throw new Error('Ingresa el motivo antes de marcar como no entregada.');
      }

      if (currentNote) {
        body.delivery.notes = currentNote;
      }

      if (status === 'delivered') {
        body.delivery.completedAt = new Date().toISOString();
      }

      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo actualizar la logística');
      }

      await onUpdated();
      if (status === 'failed' || status === 'delivered') {
        setNoteDrafts((prev) => ({ ...prev, [saleId]: '' }));
      }
    } catch (error: any) {
      setActionError(error.message || 'Error al actualizar la logística');
    } finally {
      setLoadingSaleId(null);
    }
  };

  const saveSchedule = async (saleId: string) => {
    setActionError(null);
    const selectedDate = dateDrafts[saleId];

    if (!selectedDate) {
      setActionError('Selecciona una fecha de entrega antes de guardar.');
      return;
    }

    setLoadingSaleId(saleId);

    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery: {
            status: 'scheduled',
            scheduledDate: new Date(`${selectedDate}T09:00:00`).toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo guardar la fecha de entrega');
      }

      await onUpdated();
    } catch (error: any) {
      setActionError(error.message || 'Error al guardar fecha logística');
    } finally {
      setLoadingSaleId(null);
    }
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) {
      setActionError('Este cliente no tiene teléfono registrado.');
      return;
    }

    const normalized = phone.replace(/[^\d]/g, '');
    if (!normalized) {
      setActionError('El teléfono no es válido para WhatsApp.');
      return;
    }

    const text = encodeURIComponent('Hola, te escribimos desde AGUAS para coordinar tu entrega.');
    window.open(`https://wa.me/${normalized}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const printTodayRoute = () => {
    const todaySales = enrichedSales.filter((sale) => sale.scheduled && sale.scheduled >= startToday && sale.scheduled < endToday);

    const rows = todaySales
      .map((sale, idx) => {
        const phone = sale.client?.phone || '-';
        const address = sale.client?.address || 'Sin dirección';
        const amount = formatCurrency(sale.total);
        return `<tr><td>${idx + 1}</td><td>${sale.clientLabel}</td><td>${address}</td><td>${phone}</td><td>${amount}</td><td>□</td></tr>`;
      })
      .join('');

    const html = `
      <html>
        <head>
          <title>Hoja de ruta - AGUAS</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
            h1 { margin: 0 0 6px; }
            p { margin: 0 0 16px; color: #475569; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
            th { background: #e2e8f0; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Hoja de ruta diaria</h1>
          <p>${startToday.toLocaleDateString('es-CL')} · Total entregas: ${todaySales.length}</p>
          <table>
            <thead>
              <tr><th>#</th><th>Cliente</th><th>Dirección</th><th>Teléfono</th><th>Monto</th><th>OK</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">Sin entregas programadas hoy.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderSaleCard = (sale: any) => {
    const status = sale.delivery?.status;
    const scheduledDate = sale.delivery?.scheduledDate
      ? new Date(sale.delivery.scheduledDate).toLocaleDateString('es-CL')
      : 'Sin fecha';
    const deliveredAt = sale.delivery?.completedAt
      ? new Date(sale.delivery.completedAt).toLocaleString('es-CL')
      : null;
    const draftValue = dateDrafts[sale.id] || '';
    const noteDraft = noteDrafts[sale.id] || '';
    const isBusy = loadingSaleId === sale.id;
    const cardClasses = getCardPriorityClasses(status, sale.scheduled, startToday, endToday);

    return (
      <article key={sale.id} className={`rounded-xl border p-4 ${cardClasses}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">{sale.clientLabel}</h4>
            <p className="text-sm text-slate-500">
              Venta {new Date(sale.createdAt).toLocaleDateString('es-CL')} · {sale.items.length} item(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-emerald-700">{formatCurrency(sale.total)}</p>
            <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getDeliveryStatusClasses(status)}`}>
              {getDeliveryStatusLabel(status)}
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Fecha programada</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{scheduledDate}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Fecha entrega real</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{deliveredAt || 'Sin confirmar'}</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Contacto:</span> {sale.client?.contactName || sale.client?.name || 'Sin contacto'}
          </p>
          <p>
            <span className="font-semibold">Número:</span> {sale.client?.phone || 'Sin teléfono'}
          </p>
          <p>
            <span className="font-semibold">Dirección:</span> {sale.client?.address || 'Sin dirección'}
          </p>
          <div className="mt-2">
            <button
              onClick={() => openWhatsApp(sale.client?.phone)}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              WhatsApp cliente
            </button>
          </div>
        </div>

        {!driverMode && (
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              type="date"
              value={draftValue}
              onChange={(e) => setDateDrafts((prev) => ({ ...prev, [sale.id]: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
            <button
              onClick={() => saveSchedule(sale.id)}
              disabled={isBusy}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-60"
            >
              Programar
            </button>
            <button
              onClick={() => markStatus(sale.id, 'in_transit')}
              disabled={isBusy}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 disabled:opacity-60"
            >
              Despachada
            </button>
            <button
              onClick={() => markStatus(sale.id, 'delivered')}
              disabled={isBusy}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60"
            >
              Entregada
            </button>
          </div>
        )}

        {driverMode && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => markStatus(sale.id, 'delivered')}
              disabled={isBusy}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-60"
            >
              Entregada
            </button>
            <button
              onClick={() => markStatus(sale.id, 'failed')}
              disabled={isBusy}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-800 disabled:opacity-60"
            >
              No entregada
            </button>
          </div>
        )}

        {!driverMode && (
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [sale.id]: e.target.value }))}
              placeholder="Motivo si no se entregó (opcional en otros estados)"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
            <button
              onClick={() => markStatus(sale.id, 'failed')}
              disabled={isBusy}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
            >
              No entregada
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="mt-2">
            <button
              onClick={() => rescheduleToTomorrow(sale.id)}
              disabled={isBusy}
              className="w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            >
              Reprogramar para manana
            </button>
          </div>
        )}

        {sale.delivery?.notes && (
          <p className="mt-2 text-xs text-slate-600">Motivo guardado: {sale.delivery.notes}</p>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-4">
      {!driverMode && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Entregas de hoy</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{todayCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Pendientes logisticos</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Atrasadas</p>
            <p className="mt-1 text-3xl font-semibold text-rose-700">{overdueCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Cumplimiento a tiempo</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{onTimeRate}%</p>
            <p className="text-xs text-slate-500">{onTimeDeliveredCount} de {deliveredSales.length} entregas completadas</p>
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, contacto, telefono, direccion o sector"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        />
        <button
          onClick={() => setGroupBySector((prev) => !prev)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            groupBySector ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          {groupBySector ? 'Agrupado por sector' : 'Agrupar por sector'}
        </button>
        <button
          onClick={() => setDriverMode((prev) => !prev)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            driverMode ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          {driverMode ? 'Modo completo' : 'Modo conductor'}
        </button>
        <button
          onClick={printTodayRoute}
          className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800"
        >
          Imprimir hoja de ruta
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="block text-xs uppercase tracking-[0.12em] text-slate-500">Filtro de estado</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as DeliveryStatusFilter)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="all">Todos</option>
          <option value="missing">Sin programar</option>
          <option value="overdue">Atrasadas</option>
          <option value="scheduled">Programadas</option>
          <option value="in_transit">Despachadas</option>
          <option value="delivered">Entregadas</option>
          <option value="failed">No entregadas</option>
        </select>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {actionError}
        </div>
      )}

      <div className="space-y-3">
        {filteredSales.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
            No hay ventas para este filtro.
          </div>
        )}

        {!groupBySector && filteredSales.map((sale) => renderSaleCard(sale))}

        {groupBySector &&
          Object.entries(groupedSales).map(([sector, sectorSales]) => (
            <div key={sector} className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">
                Sector: {sector.replaceAll('_', ' ')} ({sectorSales.length})
              </div>
              {sectorSales.map((sale) => renderSaleCard(sale))}
            </div>
          ))}
      </div>
    </div>
  );
}
