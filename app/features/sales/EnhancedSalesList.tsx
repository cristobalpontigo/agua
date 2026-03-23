/**
 * LISTADO DE VENTAS MEJORADO
 * Integrado con Context API, mejor UI, acciones rápidas
 */

'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { SaleService } from '@/lib/services/sale.service';
import { Button, Badge, Card, Select } from '@/components/ui/FormComponents';
import { PRODUCTS } from '@/lib/constants';

type FilterStatus = 'todos' | 'pendiente' | 'completada' | 'cancelada';

export function EnhancedSalesList() {
  const { sales, payments, updateSale, deleteSale } = useAppContext();
  const { addToast } = useToast();
  const [filter, setFilter] = useState<FilterStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar ventas
  const filtered = useMemo(() => {
    return sales.filter(sale => {
      const matchesStatus = filter === 'todos' || sale.status === filter;
      const matchesSearch = 
        sale.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [sales, filter, searchTerm]);

  // Agrupar por estado para estadísticas
  const stats = useMemo(() => {
    return {
      total: filtered.length,
      pendiente: filtered.filter(s => s.status === 'pendiente').length,
      completada: filtered.filter(s => s.status === 'completada').length,
      cancelada: filtered.filter(s => s.status === 'cancelada').length,
    };
  }, [filtered]);

  // Cambiar estado
  const handleStatusChange = (id: string, newStatus: string) => {
    updateSale(id, { status: newStatus as any });
    addToast(`Estado actualizado a "pendiente"`, 'success');
  };

  // Eliminar venta
  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta venta?')) {
      deleteSale(id);
      addToast('Venta eliminada', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">📋 Historial de Ventas</h2>
        <p className="text-slate-400">Total: {stats.total} | Pendientes: {stats.pendiente} | Completas: {stats.completada}</p>
      </div>

      {/* Controles */}
      <Card>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-blue-300 mb-2">🔍 Buscar</label>
            <input
              type="text"
              placeholder="Cliente o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:border-blue-500 transition"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Estado"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
              options={[
                { value: 'todos', label: 'Todas' },
                { value: 'pendiente', label: 'Pendientes' },
                { value: 'completada', label: 'Completadas' },
                { value: 'cancelada', label: 'Canceladas' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      {filtered.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="px-4 py-3 text-left text-blue-300 font-bold">Cliente</th>
                  <th className="px-4 py-3 text-left text-blue-300 font-bold">Productos</th>
                  <th className="px-4 py-3 text-right text-blue-300 font-bold">Total</th>
                  <th className="px-4 py-3 text-center text-blue-300 font-bold">Estado</th>
                  <th className="px-4 py-3 text-center text-blue-300 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {filtered.map(sale => {
                  const total = SaleService.calculateTotal(sale.items);
                  const salePayments = payments.filter(p => p.saleId === sale.id);
                  const paidAmount = SaleService.calculatePaidAmount(salePayments);
                  const isPaid = paidAmount >= total;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-700 bg-opacity-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{sale.clientId}</p>
                        <p className="text-xs text-slate-400">{sale.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {sale.items.slice(0, 2).map((item, i) => (
                            <Badge key={i} variant="info">
                              {PRODUCTS[item.productId].name} ×{item.quantity}
                            </Badge>
                          ))}
                          {sale.items.length > 2 && (
                            <Badge variant="info">+{sale.items.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-green-400">${total.toLocaleString()}</p>
                        {isPaid && <p className="text-xs text-green-300">Pagado ✓</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={sale.status === 'completada' ? 'success' : sale.status === 'cancelada' ? 'error' : 'warning'}>
                          {sale.status === 'pendiente' ? '⏳ Pendiente' : sale.status === 'completada' ? '✓ Completada' : '✕ Cancelada'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <select
                            value={sale.status}
                            onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                            className="px-2 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(sale.id)}
                          >
                            ✕
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <p className="text-xl text-slate-400 mb-2">📭 Sin ventas</p>
            <p className="text-slate-500">Crea tu primera venta para verla aquí</p>
          </div>
        </Card>
      )}
    </div>
  );
}
