'use client';

import { useState, useEffect } from 'react';
import { Sale, SaleLineItem, ProductType, SectorType } from '@/lib/types';
import { PRODUCTS, SECTORS, SAMPLE_CLIENTS } from '@/lib/constants';
import { calculateSaleTotal, generateSaleSummary, generateId, formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';

interface SalesReportsProps {
  sales: Sale[];
}

export function SalesReports({ sales }: SalesReportsProps) {
  const [selectedSector, setSelectedSector] = useState<SectorType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const sectorMatch = selectedSector === 'all' || sale.sector === selectedSector;
    const statusMatch = filterStatus === 'all' || sale.status === filterStatus;
    return sectorMatch && statusMatch;
  });

  // Calculate statistics
  const totalSales = filteredSales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
  const totalTransactions = filteredSales.length;
  const completedCount = filteredSales.filter(s => s.status === 'completada').length;
  const pendingAmount = filteredSales
    .filter(s => s.status === 'pendiente')
    .reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);

  // Group by sector
  const sectorStats = new Map<SectorType, { count: number; total: number }>();
  filteredSales.forEach(sale => {
    const current = sectorStats.get(sale.sector) || { count: 0, total: 0 };
    sectorStats.set(sale.sector, {
      count: current.count + 1,
      total: current.total + SaleService.calculateTotal(sale.items),
    });
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
            >
              <option value="all">Todos los Sectores</option>
              {Object.values(SECTORS).map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Ventas</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{formatCurrency(totalSales)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Transacciones</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{totalTransactions}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Completadas</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{completedCount}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <p className="text-sm text-red-700 font-medium">Pendiente Pagar</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>

      {/* Reports by Sector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Ventas por Sector</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Sector</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Transacciones</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Total</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from(sectorStats.entries()).map(([sectorId, stats]) => (
                <tr key={sectorId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {SECTORS[sectorId]?.name || sectorId}
                  </td>
                  <td className="px-4 py-3 text-center">{stats.count}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(stats.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(stats.total / stats.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Clientes Top</h3>
        <div className="space-y-2">
          {Array.from(
            new Map(
              filteredSales
                .reduce((acc, sale) => {
                  const existing = acc.find(s => s.clientName === sale.clientId);
                  if (existing) {
                    existing.total += SaleService.calculateTotal(sale.items);
                    existing.count += 1;
                  } else {
                    acc.push({ clientName: sale.clientId, total: SaleService.calculateTotal(sale.items), count: 1 });
                  }
                  return acc;
                }, [] as any[])
                .sort((a, b) => b.total - a.total)
                .slice(0, 10)
                .map(item => [item.clientName, item])
            ).values()
          ).map(({ clientName, total, count }) => (
            <div key={clientName} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{clientName}</p>
                <p className="text-sm text-gray-600">{count} transacciones</p>
              </div>
              <p className="font-semibold text-blue-600">{formatCurrency(total)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
