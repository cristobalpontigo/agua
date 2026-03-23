/**
 * SERVICIOS - Lógica de negocios y cálculos
 * Centralizado para reutilizar en cualquier componente
 */

import { Sale, Payment, SaleLineItem, ProductType } from '@/lib/types';
import { PRODUCTS } from '@/lib/constants';

export class SaleService {
  /**
   * Calcula el total de una venta
   */
  static calculateTotal(items: SaleLineItem[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  /**
   * Calcula el monto pagado
   */
  static calculatePaidAmount(payments: Payment[] = []): number {
    return payments
      .filter(p => p.status === 'completado')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  /**
   * Calcula el monto pendiente
   */
  static calculatePendingAmount(total: number, paidAmount: number): number {
    return Math.max(0, total - paidAmount);
  }

  /**
   * Verifica si una venta está completamente pagada
   */
  static isPaid(total: number, paidAmount: number): boolean {
    return paidAmount >= total;
  }

  /**
   * Verifica si una venta está vencida (sin pagar después de la fecha de entrega)
   */
  static isOverdue(sale: Sale, paidAmount: number, total: number): boolean {
    if (this.isPaid(total, paidAmount)) return false;
    if (!sale.deliveryDate) return false;
    
    const now = new Date();
    const deliveryDate = new Date(sale.deliveryDate);
    return now > deliveryDate;
  }

  /**
   * Resumen legible de una venta
   */
  static generateSummary(items: SaleLineItem[]): string {
    const grouped = items.reduce((acc, item) => {
      const product = PRODUCTS[item.productId];
      acc[product.name] = (acc[product.name] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, qty]) => `${qty}x ${name}`)
      .join(' + ');
  }

  /**
   * Agrupa ventas por cliente
   */
  static groupByClient(sales: Sale[]): Record<string, Sale[]> {
    return sales.reduce((acc, sale) => {
      const key = sale.clientId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(sale);
      return acc;
    }, {} as Record<string, Sale[]>);
  }

  /**
   * Filtra ventas por estado
   */
  static filterByStatus(sales: Sale[], status: string) {
    return sales.filter(s => s.status === status);
  }

  /**
   * Calcula estadísticas de ventas
   */
  static getStats(sales: Sale[], payments: Payment[] = []) {
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, s) => sum + this.calculateTotal(s.items), 0);
    const totalPaid = payments
      .filter(p => p.status === 'completado')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPending = totalAmount - totalPaid;
    const completedSales = sales.filter(s => s.status === 'completada').length;
    const conversionRate = totalSales > 0 ? Math.round((completedSales / totalSales) * 100) : 0;

    return {
      totalSales,
      totalAmount,
      totalPaid,
      totalPending,
      completedSales,
      pendingSales: totalSales - completedSales,
      conversionRate,
      collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
    };
  }
}

/**
 * Servicio para generar IDs únicos
 */
export class IdGeneratorService {
  static generate(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
  }

  static sale(): string { return this.generate('sale'); }
  static payment(): string { return this.generate('pay'); }
  static client(): string { return this.generate('cli'); }
  static delivery(): string { return this.generate('del'); }
}
