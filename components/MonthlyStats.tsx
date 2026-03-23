'use client';

import { Sale } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';
import { useState } from 'react';

interface MonthlyStatsProps {
  sales: Sale[];
}

export function MonthlyStats({ sales }: MonthlyStatsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Group sales by month
  const monthlyData = new Map<number, { sales: Sale[]; total: number; count: number }>();

  for (let i = 1; i <= 12; i++) {
    monthlyData.set(i, { sales: [], total: 0, count: 0 });
  }

  sales.forEach(sale => {
    const saleDate = new Date(sale.createdAt);
    if (saleDate.getFullYear() === selectedYear) {
      const month = saleDate.getMonth() + 1;
      const data = monthlyData.get(month)!;
      data.sales.push(sale);
      data.total += SaleService.calculateTotal(sale.items);
      data.count += 1;
    }
  });

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from(
    new Set(sales.map(s => new Date(s.createdAt || s.date || 0).getFullYear()))
  ).sort();

  const totalYearly = Array.from(monthlyData.values()).reduce((sum, m) => sum + m.total, 0);
  const totalTransactions = Array.from(monthlyData.values()).reduce((sum, m) => sum + m.count, 0);
  const maxMonthly = Math.max(...Array.from(monthlyData.values()).map(m => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <label className="block text-sm font-medium text-slate-300 mb-2">Selecciona Año</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white text-white"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Yearly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white border border-blue-500">
          <p className="text-sm font-medium opacity-90">Total Año {selectedYear}</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totalYearly)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white border border-green-500">
          <p className="text-sm font-medium opacity-90">Transacciones</p>
          <p className="text-3xl font-bold mt-2">{totalTransactions}</p>
          <p className="text-xs opacity-75 mt-2">Promedio: {(totalTransactions / 12).toFixed(0)}/mes</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white border border-purple-500">
          <p className="text-sm font-medium opacity-90">Promedio Mensual</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totalYearly / 12)}</p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Desglose por Mes</h3>

        {Array.from(monthlyData.entries()).map(([month, data]) => {
          const percentage = maxMonthly > 0 ? (data.total / maxMonthly) * 100 : 0;
          const completedCount = data.sales.filter(s => s.status === 'completada').length;

          return (
            <div key={month} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-white text-lg">{monthNames[month - 1]}</h4>
                  <p className="text-sm text-slate-400">
                    {data.count} transacciones • {completedCount} completadas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(data.total)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Promedio: {formatCurrency(data.count > 0 ? data.total / data.count : 0)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Month Stats Grid */}
              {data.count > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Mínimo</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {formatCurrency(Math.min(...data.sales.map(s => SaleService.calculateTotal(s.items))))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Máximo</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {formatCurrency(Math.max(...data.sales.map(s => SaleService.calculateTotal(s.items))))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">% Completadas</p>
                    <p className="text-sm font-semibold text-green-400">
                      {((completedCount / data.count) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Comparativa Mensual</h3>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Array.from(monthlyData.entries()).map(([month, data]) => {
            const percentage = maxMonthly > 0 ? (data.total / maxMonthly) * 100 : 0;

            return (
              <div key={month} className="text-center">
                <div className="bg-slate-600 rounded-lg p-2 mb-2 h-32 flex items-end justify-center">
                  <div
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-full transition-all"
                    style={{ height: `${percentage}%`, minHeight: '4px' }}
                    title={formatCurrency(data.total)}
                  />
                </div>
                <p className="text-xs font-medium text-slate-300">{monthNames[month - 1].substring(0, 3)}</p>
                <p className="text-xs text-slate-400">{data.count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
