'use client';

import { Sale } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';
import { useState } from 'react';

interface SimpleSalesListProps {
  sales: Sale[];
}

export function SimpleSalesList({ sales }: SimpleSalesListProps) {
  const [filter, setFilter] = useState<'todas' | 'completadas' | 'pendientes'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter(sale => {
    if (filter !== 'todas' && sale.status !== (filter === 'completadas' ? 'completada' : 'pendiente')) {
      return false;
    }
    if (searchTerm && !sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
