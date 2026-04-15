'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { ProductsManager } from '@/components/ProductsManager';
import { DangerZone } from '@/components/DangerZone';
import { Cotizador } from '@/components/Cotizador';
import { useClients, useSales } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/utils';

type TabType = 'new' | 'list' | 'clients' | 'billing' | 'logistics' | 'reminders' | 'products' | 'quotes';

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
  // Fetch payments from API
  const [apiPayments, setApiPayments] = useState<any[]>([]);
  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' });
      if (res.ok) setApiPayments(await res.json());
    } catch {}
  }, []);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const allPayments = apiPayments.length > 0 ? apiPayments : payments;
  const totalPaid = allPayments
    .filter(p => p.status === 'completed' || p.status === 'completado')
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
    { id: 'products', label: 'Productos', icon: '📦' },
    { id: 'quotes', label: 'Cotizar', icon: '📄' },
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
      helper: `${allPayments.filter(p => p.status === 'completed' || p.status === 'completado').length} pagos`,
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
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-0 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute top-52 right-0 h-96 w-96 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-slate-900 truncate">Aguas Continental</h1>
              <p className="text-xs text-slate-500 truncate">{monthLabel}</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('new')}
                className="rounded-xl border border-cyan-300/70 bg-cyan-50 px-3 py-2 text-xs sm:text-sm font-semibold text-cyan-800 transition active:scale-95"
              >
                + Venta
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className="hidden sm:block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition active:scale-95"
              >
                Cobros
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-3 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 overflow-hidden">
        <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {metrics.map(metric => (
            <article
              key={metric.label}
              className={`rounded-2xl border ${metric.border} bg-white/85 p-3 sm:p-4 shadow-[0_12px_36px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md`}
            >
              <div className={`mb-2 sm:mb-3 h-1.5 sm:h-2 w-16 sm:w-24 rounded-full bg-gradient-to-r ${metric.accent}`} />
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
              <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 truncate">{metric.helper}</p>
            </article>
          ))}
        </section>

        <section className="mt-4 sm:mt-6 flex flex-col lg:grid lg:grid-cols-[1.3fr_1fr] gap-4">
          <div className="rounded-2xl border border-white/60 bg-white/85 p-3 shadow-[0_16px_38px_-24px_rgba(15,23,42,0.5)] backdrop-blur-md sm:p-6 min-w-0 overflow-hidden">
            <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Flujo principal</h2>
              <span className="hidden sm:inline rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {loading ? 'Cargando datos...' : 'Listo para operar'}
              </span>
            </div>

            <div className="mb-4 sm:mb-5 overflow-x-auto -mx-1 px-1 scrollbar-hide">
              <div className="flex gap-1.5 sm:gap-2 sm:flex-wrap rounded-xl border border-slate-200/80 bg-slate-50/75 p-1.5 sm:p-2 w-max sm:w-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap active:scale-95 ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white shadow'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <span className="mr-1 sm:mr-2 text-[10px] sm:text-xs">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {(salesError || clientsError) && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {salesError && <p>Error al cargar ventas: {salesError}</p>}
                  {clientsError && <p>Error al cargar clientes: {clientsError}</p>}
                </div>
              )}

              {activeTab === 'new' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-900">Registrar venta rápida</h3>
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
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-900">Seguimiento de ventas</h3>
                  <SimpleSalesList sales={availableSales as any} onUpdated={async () => { await refetchSales(); await fetchPayments(); }} />
                </div>
              )}

              {activeTab === 'clients' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <SimpleClientManager sales={availableSales as any} />
                </div>
              )}

              {activeTab === 'logistics' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-900">Logística y entregas</h3>
                  <LogisticsPanel sales={availableSales as any} onUpdated={refetchSales} />
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-900">Cobranza y facturación</h3>
                  <BillingReport sales={availableSales as any} clients={availableClients as any} />
                </div>
              )}

              {activeTab === 'reminders' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <RemindersPanel />
                </div>
              )}

              {activeTab === 'products' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <ProductsManager />
                </div>
              )}

              {activeTab === 'quotes' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6">
                  <Cotizador />
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_16px_38px_-24px_rgba(15,23,42,0.5)] backdrop-blur-md sm:p-6 min-w-0 overflow-hidden">
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

            <DangerZone />
          </aside>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/90 backdrop-blur-xl md:hidden safe-area-bottom">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 px-2 py-2 w-max">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition active:scale-95 shrink-0 ${
                    activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="text-sm leading-none mb-0.5">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
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
