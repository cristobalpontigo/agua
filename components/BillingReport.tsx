'use client';

import { useEffect, useState } from 'react';
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
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [savingInvoiceId, setSavingInvoiceId] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingSuccess, setBillingSuccess] = useState<string | null>(null);

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
      productBreakdown: { productId: string; quantity: number; subtotal: number }[];
    }[] = [];

    const filteredClients = selectedClientId === 'all'
      ? clients
      : clients.filter(c => c.id === selectedClientId);

    filteredClients.forEach(client => {
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

      // Build product breakdown
      const prodMap: Record<string, { quantity: number; subtotal: number }> = {};
      clientSales.forEach(s => {
        (s.items || []).forEach((item: any) => {
          const pid = item.productId || 'desconocido';
          if (!prodMap[pid]) prodMap[pid] = { quantity: 0, subtotal: 0 };
          prodMap[pid].quantity += item.quantity || 0;
          prodMap[pid].subtotal += (item.quantity || 0) * (item.price || 0);
        });
      });
      const productBreakdown = Object.entries(prodMap)
        .map(([productId, v]) => ({ productId, ...v }))
        .sort((a, b) => b.subtotal - a.subtotal);

      if (clientSales.length > 0) {
        billingData.push({
          clientId: client.id,
          clientName: client.name,
          billingDay,
          sales: clientSales,
          amount,
          productBreakdown,
        });
      }
    });

    return billingData.sort((a, b) => a.billingDay - b.billingDay);
  };

  const billingData = getBillingForMonth(selectedMonth);
  const totalMonthly = billingData.reduce((sum, item) => sum + item.amount, 0);
  const totalClients = billingData.length;

  const pendingByClient = clients
    .map(client => {
      const clientSales = sales.filter(s => s.clientId === client.id);
      const totalSold = clientSales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
      const totalPaid = (clientSales || []).reduce((sum, s) => {
        const paid = (s.payments || [])
          .filter((p: any) => p.status === 'completed' || p.status === 'completado')
          .reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        return sum + paid;
      }, 0);
      const pending = Math.max(0, totalSold - totalPaid);
      return {
        clientId: client.id,
        clientName: client.name,
        pending,
      };
    })
    .filter(item => item.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  useEffect(() => {
    const loadBillingRecords = async () => {
      try {
        setBillingError(null);
        const response = await fetch(`/api/billing?year=${selectedYear}&month=${selectedMonth}`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los numeros de factura');
        }

        const records = await response.json();
        const nextValues = (records as any[]).reduce((acc, record) => {
          acc[record.clientId] = record.invoiceNumber || '';
          return acc;
        }, {} as Record<string, string>);

        setInvoiceNumbers(nextValues);
      } catch (error: any) {
        setBillingError(error.message || 'Error al cargar facturas');
      }
    };

    loadBillingRecords();
  }, [selectedMonth, selectedYear]);

  const saveInvoiceNumber = async (clientId: string) => {
    try {
      setSavingInvoiceId(clientId);
      setBillingError(null);
      setBillingSuccess(null);

      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          year: selectedYear,
          month: selectedMonth,
          invoiceNumber: invoiceNumbers[clientId] || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo guardar el numero de factura');
      }

      setBillingSuccess('Numero de factura guardado.');
    } catch (error: any) {
      setBillingError(error.message || 'Error al guardar el numero de factura');
    } finally {
      setSavingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Cliente</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todos los clientes</option>
            {clients
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
      </div>

      {billingError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {billingError}
        </div>
      )}

      {billingSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {billingSuccess}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 font-semibold">Total {monthNames[selectedMonth - 1]} {selectedYear}</p>
          <p className="text-3xl font-bold mt-2 text-blue-900">{formatCurrency(totalMonthly)}</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <p className="text-sm text-emerald-700 font-semibold">Clientes con ventas</p>
          <p className="text-3xl font-bold mt-2 text-emerald-900">{totalClients}</p>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
          <p className="text-sm text-cyan-700 font-semibold">Total ventas</p>
          <p className="text-3xl font-bold mt-2 text-cyan-900">{billingData.reduce((s, b) => s + b.sales.length, 0)}</p>
          <p className="text-xs text-cyan-600 mt-1">{billingData.reduce((s, b) => s + b.productBreakdown.reduce((a, p) => a + p.quantity, 0), 0)} unidades vendidas</p>
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
                <div className="flex items-center justify-between gap-4">
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

                {/* Product breakdown */}
                {item.productBreakdown.length > 0 && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-left">
                          <th className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</th>
                          <th className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 text-center">Cant.</th>
                          <th className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.productBreakdown.map((pb) => (
                          <tr key={pb.productId} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 text-slate-700">{pb.productId}</td>
                            <td className="px-3 py-1.5 text-slate-900 font-semibold text-center">{pb.quantity}</td>
                            <td className="px-3 py-1.5 text-emerald-700 font-semibold text-right">{formatCurrency(pb.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">
                      N. factura SSI
                    </label>
                    <input
                      type="text"
                      value={invoiceNumbers[item.clientId] || ''}
                      onChange={(e) =>
                        setInvoiceNumbers((prev) => ({
                          ...prev,
                          [item.clientId]: e.target.value,
                        }))
                      }
                      placeholder="Ingresar numero manual"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => saveInvoiceNumber(item.clientId)}
                    disabled={savingInvoiceId === item.clientId}
                    className="self-end rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-60"
                  >
                    {savingInvoiceId === item.clientId ? 'Guardando...' : 'Guardar N.'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Cobros pendientes por cliente</h3>
        <div className="space-y-2">
          {pendingByClient.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
              No hay deudas pendientes.
            </div>
          ) : (
            pendingByClient.map(item => (
              <div key={item.clientId} className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg p-3">
                <p className="font-semibold text-slate-900">{item.clientName}</p>
                <p className="text-rose-700 font-bold">{formatCurrency(item.pending)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
