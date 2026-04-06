'use client';

import { useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import { useAppContext } from '@/context/AppContext';
import { SaleService } from '@/lib/services/sale.service';
import { SimpleSaleForm } from '@/components/SimpleSaleForm';
import { SimpleSalesList } from '@/components/SimpleSalesList';
import { SimpleClientManager } from '@/components/SimpleClientManager';
import { BillingReport } from '@/components/BillingReport';
import { LogisticsPanel } from '@/components/LogisticsPanel';
import { MobileLoginGate } from '@/components/MobileLoginGate';
import { RemindersPanel } from '@/components/RemindersPanel';
import { useClients, useSales } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/utils';

type TabType = 'new' | 'list' | 'clients' | 'billing' | 'logistics' | 'reminders';

function AppContent() {
  const { sales, clients, payments, loading } = useAppContext();
  const { data: apiClientsData, error: clientsError } = useClients();
  const { data: apiSalesData, error: salesError, refetch: refetchSales } = useSales();
  const [activeTab, setActiveTab] = useState<TabType>('new');

  const hasApiClientsData = Array.isArray(apiClientsData);
  const hasApiSalesData = Array.isArray(apiSalesData);
  const apiClients = hasApiClientsData ? (apiClientsData as any[]) : [];
  const apiSalesRaw = hasApiSalesData ? (apiSalesData as any[]) : [];
  const availableClients = hasApiClientsData ? apiClients : clients;
  const normalizedApiSales = apiSalesRaw.map((sale: any) => ({
    ...sale,
    clientName: sale.clientName || sale.client?.name,
    items: sale.items || sale.saleItems || [],
    status:
      sale.status === 'pending'
        ? 'pendiente'
        : sale.status === 'completed'
          ? 'completada'
          : sale.status === 'cancelled'
            ? 'cancelada'
            : sale.status,
  }));
  const availableSales = hasApiSalesData ? normalizedApiSales : sales;

  const totalAmount = availableSales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
  const totalPaid = payments
    .filter(p => p.status === 'completado')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = Math.max(0, totalAmount - totalPaid);
  const pendingSales = availableSales.filter(sale => sale.status === 'pendiente').length;
  const monthLabel = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const todaySales = availableSales.filter(s => {
    const d = new Date((s as any).createdAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayAmount = todaySales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
  const overduePending = availableSales.filter(s => {
    if (s.status !== 'pendiente') return false;
    const daysOld = (Date.now() - new Date((s as any).createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 2;
  });

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'new', label: 'Nueva venta', icon: '＋' },
    { id: 'list', label: 'Ventas', icon: '▦' },
    { id: 'logistics', label: 'Logística', icon: '↗' },
    { id: 'clients', label: 'Clientes', icon: '◉' },
    { id: 'billing', label: 'Facturación', icon: '¤' },
    { id: 'reminders', label: 'Recordatorios', icon: '🔔' },
  ];

  const metrics = [
    {
      label: 'Ventas del período',
      value: formatCurrency(totalAmount),
      helper: `${availableSales.length} registros`,
      accent: 'from-cyan-500/20 to-cyan-200/0',
      border: 'border-cyan-300/30',
    },
    {
      label: 'Cobrado',
      value: formatCurrency(totalPaid),
      helper: `${payments.filter(p => p.status === 'completado').length} pagos`,
      accent: 'from-emerald-500/20 to-emerald-200/0',
      border: 'border-emerald-300/40',
    },
    {
      label: 'Por cobrar',
      value: formatCurrency(pendingAmount),
      helper: `${pendingSales} ventas pendientes`,
      accent: 'from-amber-500/20 to-amber-200/0',
      border: 'border-amber-300/40',
    },
    {
      label: 'Clientes activos',
      value: `${availableClients.length}`,
      helper: 'Base actual',
      accent: 'from-slate-600/20 to-slate-200/0',
      border: 'border-slate-300/45',
    },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute top-52 -right-20 h-96 w-96 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Panel diario</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">AGUAS Gestión PYME</h1>
              <p className="mt-1 text-sm text-slate-600">Control simple de ventas, clientes y cobranza para {monthLabel}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:text-right">
              <button
                onClick={() => setActiveTab('new')}
                className="rounded-xl border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:-translate-y-0.5 hover:bg-cyan-100"
              >
                Nueva venta
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                Revisar cobros
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(metric => (
            <article
              key={metric.label}
              className={`rounded-2xl border ${metric.border} bg-white/85 p-4 shadow-[0_12px_36px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md`}
            >
              <div className={`mb-3 h-2 w-24 rounded-full bg-gradient-to-r ${metric.accent}`} />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-500">{metric.helper}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_16px_38px_-24px_rgba(15,23,42,0.5)] backdrop-blur-md sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Flujo principal</h2>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {loading ? 'Cargando datos...' : 'Listo para operar'}
              </span>
            </div>

            <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-slate-50/75 p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <span className="mr-2 text-xs">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              {(salesError || clientsError) && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {salesError && <p>Error al cargar ventas: {salesError}</p>}
                  {clientsError && <p>Error al cargar clientes: {clientsError}</p>}
                </div>
              )}

              {activeTab === 'new' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Registrar venta rápida</h3>
                  <SimpleSaleForm
                    clients={availableClients as any}
                    onSaleCreated={async () => {
                      await refetchSales();
                      setActiveTab('list');
                    }}
                  />
                </div>
              )}

              {activeTab === 'list' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Seguimiento de ventas</h3>
                  <SimpleSalesList sales={availableSales as any} onUpdated={refetchSales} />
                </div>
              )}

              {activeTab === 'clients' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <SimpleClientManager sales={availableSales as any} />
                </div>
              )}

              {activeTab === 'logistics' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Logística y entregas</h3>
                  <LogisticsPanel sales={availableSales as any} onUpdated={refetchSales} />
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Cobranza y facturación</h3>
                  <BillingReport sales={availableSales as any} clients={availableClients as any} />
                </div>
              )}

              {activeTab === 'reminders' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <RemindersPanel />
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_16px_38px_-24px_rgba(15,23,42,0.5)] backdrop-blur-md sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">Vista del día</h2>
            <p className="mt-1 text-sm text-slate-500 capitalize">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {/* Métricas del día */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-cyan-50 border border-cyan-200 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-600">Ventas hoy</p>
                <p className="text-2xl font-bold text-cyan-900">{todaySales.length}</p>
                <p className="text-[11px] text-cyan-700">{formatCurrency(todayAmount)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${
                overduePending.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                  overduePending.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>Vencidas</p>
                <p className={`text-2xl font-bold ${
                  overduePending.length > 0 ? 'text-rose-900' : 'text-emerald-900'
                }`}>{overduePending.length}</p>
                <p className={`text-[11px] ${
                  overduePending.length > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}>{overduePending.length > 0 ? 'Cobrar hoy' : '¡Al día!'}</p>
              </div>
            </div>

            {/* Por cobrar total */}
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Por cobrar total</p>
              <p className="text-2xl font-semibold text-amber-800">{formatCurrency(pendingAmount)}</p>
              <p className="text-xs text-amber-600 mt-0.5">{pendingSales} venta(s) pendiente(s)</p>
            </div>

            {/* Clientes con deuda vencida */}
            {overduePending.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Deuda vencida &gt;2 días</p>
                <div className="space-y-1.5">
                  {overduePending.slice(0, 4).map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-rose-900">{sale.clientName}</p>
                        <p className="text-[11px] text-rose-600">{formatCurrency(SaleService.calculateTotal(sale.items))}</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('list')}
                        className="text-[11px] text-rose-700 underline font-medium"
                      >
                        Ver
                      </button>
                    </div>
                  ))}
                  {overduePending.length > 4 && (
                    <button onClick={() => setActiveTab('list')} className="text-xs text-slate-500 underline">
                      +{overduePending.length - 4} más...
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Acciones rápidas */}
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Acciones rápidas</p>
              <button
                onClick={() => setActiveTab('new')}
                className="w-full rounded-xl border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                + Nueva venta
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Revisar cobros
              </button>
              {overduePending.length > 0 && (
                <button
                  onClick={() => setActiveTab('list')}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Ver {overduePending.length} venta(s) vencida(s)
                </button>
              )}
            </div>
          </aside>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/90 p-3 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span className="mb-1 block text-[10px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <MobileLoginGate>
      <AppProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AppProvider>
    </MobileLoginGate>
  );
}
