'use client';

import { Sale } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';
import { useState } from 'react';

interface SimpleSalesListProps {
  sales: Sale[];
  onUpdated?: () => Promise<void>;
}

export function SimpleSalesList({ sales, onUpdated }: SimpleSalesListProps) {
  const [filter, setFilter] = useState<'todas' | 'completadas' | 'pendientes'>('todas');
  const [dateFilter, setDateFilter] = useState<'hoy' | 'semana' | 'mes' | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'cheque' | 'tarjeta'>('efectivo');
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  const saveSaleChanges = async (saleId: string, status?: 'pending' | 'completed') => {
    setSavingId(saleId);
    try {
      await fetch(`/api/sales/${saleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(status ? { status } : {}),
          ...(editingSaleId === saleId ? { notes: noteDraft } : {}),
        }),
      });
      if (onUpdated) {
        await onUpdated();
      }
    } finally {
      setSavingId(null);
      setEditingSaleId(null);
      setNoteDraft('');
    }
  };

  const handleCobrar = async (sale: any) => {
    setProcessingPayment(true);
    try {
      let userId = 'admin';
      try {
        const auth = localStorage.getItem('agua.simpleAuth');
        if (auth) userId = JSON.parse(auth).name || 'admin';
      } catch {}
      const amount = payingAmount > 0 ? payingAmount : SaleService.calculateTotal((sale as any).items);
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: (sale as any).clientId, saleId: sale.id, amount, method: paymentMethod, userId }),
      });
      await fetch(`/api/sales/${sale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      setPayingId(null);
      setPayingAmount(0);
      if (onUpdated) await onUpdated();
    } finally {
      setProcessingPayment(false);
    }
  };

  const now = new Date();
  const filteredSales = sales.filter(sale => {
    if (filter !== 'todas' && sale.status !== (filter === 'completadas' ? 'completada' : 'pendiente')) {
      return false;
    }
    if (searchTerm && !sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (dateFilter !== 'todas') {
      const saleDate = new Date((sale as any).createdAt);
      if (dateFilter === 'hoy') {
        if (saleDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'semana') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        if (saleDate < weekAgo) return false;
      } else if (dateFilter === 'mes') {
        if (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const stats = {
    total: sales.length,
    completed: sales.filter(s => s.status === 'completada').length,
    amount: sales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0),
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Búsqueda</label>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Estado</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="todas">Todas ({stats.total})</option>
            <option value="completadas">Completadas ({stats.completed})</option>
            <option value="pendientes">Pendientes ({stats.total - stats.completed})</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Total</label>
          <div className="px-4 py-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 font-bold">
            {formatCurrency(stats.amount)}
          </div>
        </div>
      </div>

      {/* Filtro por fecha */}
      <div className="flex gap-2 flex-wrap">
        {(['hoy', 'semana', 'mes', 'todas'] as const).map(f => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
              dateFilter === f
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
            }`}
          >
            {f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Últimos 7 días' : f === 'mes' ? 'Este mes' : 'Todas'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{filteredSales.length} resultado(s)</span>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-slate-100 rounded-lg p-8 text-center text-slate-500">
            No hay ventas para mostrar
          </div>
        ) : (
          filteredSales.map(sale => (
            <div
              key={sale.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900">{sale.clientName || 'Cliente'}</h3>
                  <p className="text-xs text-slate-500">
                    {new Date(sale.createdAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sale.status === 'completada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {sale.status === 'completada' ? '✓ Completada' : '◯ Pendiente'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">{sale.items.length} item(s)</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(SaleService.calculateTotal(sale.items))}
                  </span>
                </div>
              </div>

              {sale.notes && (
                <div className="mt-2 text-xs text-slate-600 italic">
                  📝 {sale.notes}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {sale.status === 'pendiente' && (
                  <button
                    onClick={() => {
                      setPayingId(payingId === sale.id ? null : sale.id);
                      setPayingAmount(SaleService.calculateTotal((sale as any).items));
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
                  >
                    💰 Cobrar
                  </button>
                )}
                {sale.status !== 'pendiente' && (
                  <button
                    onClick={() => saveSaleChanges(sale.id, 'pending')}
                    disabled={savingId === sale.id}
                    className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-800 border border-amber-200"
                  >
                    Reabrir
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingSaleId(editingSaleId === sale.id ? null : sale.id);
                    setNoteDraft(sale.notes || '');
                  }}
                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 border border-blue-200"
                >
                  Nota
                </button>
              </div>

              {payingId === sale.id && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-emerald-800">Registrar cobro</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={payingAmount}
                      onChange={(e) => setPayingAmount(Number(e.target.value))}
                      className="flex-1 px-2 py-1.5 text-sm border border-emerald-300 rounded bg-white"
                      placeholder="Monto"
                    />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="px-2 py-1.5 text-xs border border-emerald-300 rounded bg-white"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="cheque">Cheque</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCobrar(sale)}
                      disabled={processingPayment}
                      className="flex-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60 transition"
                    >
                      {processingPayment ? 'Registrando...' : '✓ Confirmar cobro'}
                    </button>
                    <button
                      onClick={() => setPayingId(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {editingSaleId === sale.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded"
                    placeholder="Actualizar nota de la venta"
                  />
                  <button
                    onClick={() => saveSaleChanges(sale.id)}
                    disabled={savingId === sale.id}
                    className="px-2 py-1 text-xs rounded bg-slate-900 text-white"
                  >
                    Guardar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
