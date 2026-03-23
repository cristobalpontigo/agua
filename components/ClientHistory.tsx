'use client';

import { Sale } from '@/lib/types';
import { formatDate, formatCurrency, generateSaleSummary } from '@/lib/utils';
import { SECTORS, PRODUCTS, SAMPLE_CLIENTS } from '@/lib/constants';
import { SaleService } from '@/lib/services/sale.service';
import { useState } from 'react';

interface ClientHistoryProps {
  sales: Sale[];
}

export function ClientHistory({ sales }: ClientHistoryProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  let filteredSales = sales;

  if (selectedClient) {
    filteredSales = filteredSales.filter(s => s.clientId === selectedClient);
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    filteredSales = filteredSales.filter(s => new Date(s.createdAt) >= from);
  }

  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59);
    filteredSales = filteredSales.filter(s => new Date(s.createdAt) <= to);
  }

  if (filterStatus !== 'all') {
    filteredSales = filteredSales.filter(s => s.status === filterStatus);
  }

  // Client stats
  const clientStats = new Map<string, any>();
  sales.forEach(sale => {
    if (!clientStats.has(sale.clientId)) {
      clientStats.set(sale.clientId, {
        name: sale.clientId,
        total: 0,
        count: 0,
        lastPurchase: sale.date,
        totalItems: 0,
      });
    }
    const stat = clientStats.get(sale.clientId);
    const saleTotal = SaleService.calculateTotal(sale.items);
    stat.total += saleTotal;
    stat.count += 1;
    stat.totalItems += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    if (new Date(sale.createdAt) > new Date(stat.lastPurchase)) {
      stat.lastPurchase = sale.createdAt;
    }
  });

  const sortedClients = Array.from(clientStats.values()).sort((a, b) => b.total - a.total);

  const totalFilteredAmount = filteredSales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
  const completedCount = filteredSales.filter(s => s.status === 'completada').length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
        <h3 className="text-lg font-bold text-white mb-4">Filtros de Búsqueda</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cliente</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm text-white"
            >
              <option value="">Todos los Clientes</option>
              {sortedClients.map((client) => (
                <option key={client.name} value={client.name}>
                  {client.name} (${formatCurrency(client.total)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm text-white"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {filteredSales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white border border-blue-500">
            <p className="text-sm font-medium opacity-90">Total Filtrado</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalFilteredAmount)}</p>
            <p className="text-xs opacity-75 mt-1">{filteredSales.length} transacciones</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-white border border-green-500">
            <p className="text-sm font-medium opacity-90">Completadas</p>
            <p className="text-2xl font-bold mt-1">{completedCount}</p>
            <p className="text-xs opacity-75 mt-1">{((completedCount / filteredSales.length) * 100).toFixed(0)}% del total</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 text-white border border-purple-500">
            <p className="text-sm font-medium opacity-90">Promedio por Venta</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalFilteredAmount / filteredSales.length)}</p>
            <p className="text-xs opacity-75 mt-1">Monto promedio</p>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 text-center">
            <p className="text-slate-400">No hay ventas que coincidan con los filtros</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-blue-500 transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Cliente</p>
                  <p className="font-bold text-white">{sale.clientId}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {SECTORS[sale.sector]?.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Productos</p>
                  <p className="text-sm text-slate-200">{generateSaleSummary(sale.items)}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Fecha</p>
                  <p className="font-semibold text-white">{formatDate(sale.createdAt)}</p>
                  <p className={`text-xs mt-1 px-2 py-1 rounded inline-block ${
                    sale.status === 'completada' ? 'bg-green-600 text-green-100' :
                    sale.status === 'pendiente' ? 'bg-yellow-600 text-yellow-100' :
                    'bg-red-600 text-red-100'
                  }`}>
                    {sale.status === 'completada' ? 'Completada' :
                     sale.status === 'pendiente' ? 'Pendiente' : 'Cancelada'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Monto</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(SaleService.calculateTotal(sale.items))}</p>
                </div>
              </div>

              {sale.notes && (
                <p className="text-xs text-slate-400 mt-3 italic">Nota: {sale.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
