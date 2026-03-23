'use client';

import { useState } from 'react';
import { Sale, Client } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';

interface BillingReportProps {
  sales: Sale[];
  clients: Client[];
}

export function BillingReport({ sales, clients }: BillingReportProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Calculate billing for the selected month
  const getBillingForMonth = (month: number) => {
    const billingData: {
      clientId: string;
      clientName: string;
      billingDay: number;
      sales: Sale[];
      amount: number;
    }[] = [];

    clients.forEach(client => {
      const billingDay = client.billingDay || 10;
      const clientSales = sales
        .filter(s => s.clientId === client.id)
        .filter(s => {
          const saleDate = new Date(s.createdAt);
          if (saleDate.getFullYear() !== selectedYear) return false;
          const saleMonth = saleDate.getMonth() + 1;
          return saleMonth === month;
        });

      const amount = clientSales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);

      if (clientSales.length > 0) {
        billingData.push({
          clientId: client.id,
          clientName: client.name,
          billingDay,
          sales: clientSales,
          amount
        });
      }
    });

    return billingData.sort((a, b) => a.billingDay - b.billingDay);
  };

  const billingData = getBillingForMonth(selectedMonth);
  const totalMonthly = billingData.reduce((sum, item) => sum + item.amount, 0);
  const totalClients = billingData.length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Año</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Mes</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            {monthNames.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 font-semibold">Total {monthNames[selectedMonth - 1]} {selectedYear}</p>
          <p className="text-3xl font-bold mt-2 text-blue-900">{formatCurrency(totalMonthly)}</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <p className="text-sm text-emerald-700 font-semibold">Clientes a Facturar</p>
          <p className="text-3xl font-bold mt-2 text-emerald-900">{totalClients}</p>
        </div>
      </div>

      {/* Billing Schedule */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Cronograma de Facturación</h3>
        <div className="space-y-3">
          {billingData.length === 0 ? (
            <div className="bg-slate-100 rounded-lg p-6 text-center text-slate-500">
              No hay ventas registradas para {monthNames[selectedMonth - 1]} {selectedYear}
            </div>
          ) : (
            billingData.map((item, idx) => (
              <div
                key={item.clientId}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full font-bold text-white">
                      {item.billingDay}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.clientName}</h4>
                      <p className="text-sm text-slate-500">{item.sales.length} venta(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-slate-500 mt-1">A facturar día {item.billingDay}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
