'use client';

import { Sale } from '@/lib/types';
import { PRODUCTS, SECTORS } from '@/lib/constants';
import { formatCurrency, formatDate, generateSaleSummary } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';

interface SalesListProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  onStatusChange: (id: string, status: 'pending' | 'completed' | 'cancelled') => void;
}

export function SalesList({ sales, onDeleteSale, onStatusChange }: SalesListProps) {
  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500 text-lg">No hay ventas registradas</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sector
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Productos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sale.clientId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {SECTORS[sale.sector]?.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                  <span title={generateSaleSummary(sale.items)}>
                    {generateSaleSummary(sale.items)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(sale.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-gray-900">
                  {formatCurrency(SaleService.calculateTotal(sale.items))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={sale.status}
                    onChange={(e) =>
                      onStatusChange(
                        sale.id,
                        e.target.value as 'pending' | 'completed' | 'cancelled'
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${getStatusColor(
                      sale.status
                    )} text-gray-800`}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onDeleteSale(sale.id)}
                    className="text-red-600 hover:text-red-900 font-medium"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
