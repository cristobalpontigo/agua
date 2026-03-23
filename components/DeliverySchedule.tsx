'use client';

import { Sale } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { SECTORS, PRODUCTS } from '@/lib/constants';
import { SaleService } from '@/lib/services/sale.service';
import { useState } from 'react';

interface DeliveryScheduleProps {
  sales: Sale[];
  onDeliveryStatusChange: (saleId: string, status: string) => void;
}

export function DeliverySchedule({ sales, onDeliveryStatusChange }: DeliveryScheduleProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'client' | 'amount'>('date');

  // Filter pending deliveries
  let deliveries = sales.filter(s => !s.deliveryDate || new Date(s.deliveryDate) >= new Date());

  if (selectedStatus !== 'all') {
    deliveries = deliveries.filter(s => s.status === selectedStatus);
  }

  // Sort
  deliveries.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return (a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity) - 
               (b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity);
      case 'client':
        return a.clientId.localeCompare(b.clientId);
      case 'amount':
        return SaleService.calculateTotal(b.items) - SaleService.calculateTotal(a.items);
      default:
        return 0;
    }
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayDeliveries = deliveries.filter(s => {
    if (!s.deliveryDate) return false;
    const d = new Date(s.deliveryDate);
    return d.toDateString() === today.toDateString();
  });

  const tomorrowDeliveries = deliveries.filter(s => {
    if (!s.deliveryDate) return false;
    const d = new Date(s.deliveryDate);
    return d.toDateString() === tomorrow.toDateString();
  });

  const upcomingDeliveries = deliveries.filter(s => {
    if (!s.deliveryDate) return false;
    const d = new Date(s.deliveryDate);
    return d > tomorrow;
  });

  const renderDeliveryGroup = (title: string, items: Sale[], bgColor: string) => {
    if (items.length === 0) return null;

    return (
      <div key={title} className="mb-6">
        <h4 className={`text-sm font-bold ${bgColor} px-3 py-2 rounded-t-lg text-white`}>
          {title} ({items.length})
        </h4>
        <div className="space-y-2">
          {items.map((sale) => (
            <div
              key={sale.id}
              className="bg-slate-700 border border-slate-600 p-4 rounded-lg hover:border-blue-500 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-white">{sale.clientId}</p>
                  <p className="text-sm text-slate-400">
                    {SECTORS[sale.sector]?.name || sale.sector}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">{formatCurrency(SaleService.calculateTotal(sale.items))}</p>
                  <p className="text-xs text-slate-400">
                    {sale.deliveryDate ? formatDate(sale.deliveryDate) : 'Sin fecha'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-3">
                {sale.items
                  .map(item => `${PRODUCTS[item.productId]?.name} ×${item.quantity}`)
                  .join(', ')}
              </p>

              <div className="flex gap-2">
                <select
                  value={sale.status}
                  onChange={(e) => onDeliveryStatusChange(sale.id, e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-xs text-white"
                >
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completada</option>
                  <option value="in_transit">En Tránsito</option>
                  <option value="failed">Fallida</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 flex gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Estado</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm text-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completada</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Ordenar por</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm text-white"
          >
            <option value="date">Fecha</option>
            <option value="client">Cliente</option>
            <option value="amount">Monto</option>
          </select>
        </div>
      </div>

      {/* Delivery Groups */}
      {todayDeliveries.length > 0 && renderDeliveryGroup('🚚 Entregas de Hoy', todayDeliveries, 'bg-red-600')}
      {tomorrowDeliveries.length > 0 && renderDeliveryGroup('📅 Entregas Mañana', tomorrowDeliveries, 'bg-orange-600')}
      {upcomingDeliveries.length > 0 && renderDeliveryGroup('📆 Próximas Entregas', upcomingDeliveries, 'bg-blue-600')}

      {deliveries.length === 0 && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 text-center">
          <p className="text-slate-400">No hay entregas programadas</p>
        </div>
      )}
    </div>
  );
}
