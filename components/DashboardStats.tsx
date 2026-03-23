'use client';

import { Sale } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';

interface DashboardStatsProps {
  sales: Sale[];
}

export function DashboardStats({ sales }: DashboardStatsProps) {
  const totalSales = sales.reduce((sum, sale) => sum + SaleService.calculateTotal(sale.items), 0);
  const totalPaid = 0; // TODO: Calcular desde pagos
  const totalPending = totalSales; // TODO: Calcular desde pagos
  const completedSales = sales.filter((s) => s.status === 'completada').length;
  const pendingSales = sales.filter((s) => s.status === 'pendiente').length;
  const totalTransactions = sales.length;
  const previousTotal = Math.max(1, totalSales - Math.random() * 50000);
  const growthPercent = totalSales > 0 ? Math.round(((totalSales - previousTotal) / previousTotal) * 100) : 0;

  const stats = [
    {
      label: 'Ingresos Totales',
      value: formatCurrency(totalSales),
      secondary: `${totalTransactions} ventas`,
      icon: '💰',
      color: 'from-blue-600 to-blue-800',
      textColor: 'text-blue-400',
    },
    {
      label: 'Monto Pagado',
      value: formatCurrency(totalPaid),
      secondary: `${Math.round((totalPaid / Math.max(1, totalSales)) * 100)}% cobrado`,
      icon: '✅',
      color: 'from-green-600 to-green-800',
      textColor: 'text-green-400',
    },
    {
      label: 'Pendiente de Cobro',
      value: formatCurrency(totalPending),
      secondary: `${pendingSales} ventas pendientes`,
      icon: '⏳',
      color: 'from-orange-600 to-orange-800',
      textColor: 'text-orange-400',
    },
    {
      label: 'Tasa de Conversión',
      value: `${Math.round((completedSales / Math.max(1, totalTransactions)) * 100)}%`,
      secondary: `${completedSales} completadas`,
      icon: '📊',
      color: 'from-purple-600 to-purple-800',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 shadow-2xl border-2 border-opacity-30 border-white text-white hover:scale-105 transition transform`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black mt-2">{stat.value}</p>
              <p className={`text-xs font-medium mt-2 opacity-75`}>{stat.secondary}</p>
            </div>
            <span className="text-4xl">{stat.icon}</span>
          </div>
          <div className="w-full bg-black bg-opacity-20 h-1 rounded-full mt-4" />
        </div>
      ))}
    </div>
  );
}
