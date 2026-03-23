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
import { formatCurrency } from '@/lib/utils';

type TabType = 'new' | 'list' | 'clients' | 'billing';

function AppContent() {
  const { sales, clients, payments } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('new');

  const totalAmount = sales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
  const totalPaid = payments
    .filter(p => p.status === 'completado')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = totalAmount - totalPaid;

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'new', label: 'Nueva Venta', icon: '➕' },
    { id: 'list', label: 'Historial', icon: '📋' },
    { id: 'clients', label: 'Clientes', icon: '👥' },
    { id: 'billing', label: 'Facturación', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Simple */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">💧 AGUAS</h1>
              <p className="text-sm text-slate-500 mt-1">Gestión de ventas</p>
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase">Ventas</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase">Pagado</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase">Por Cobrar</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation - Simple */}
        <div className="flex gap-4 border-b border-slate-700 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-4 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'new' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Nueva Venta</h2>
              <SimpleSaleForm clients={clients} onSaleCreated={() => setActiveTab('list')} />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Historial de Ventas</h2>
              <SimpleSalesList sales={sales} />
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <SimpleClientManager />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Facturación Mensual</h2>
              <BillingReport sales={sales} clients={clients} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
