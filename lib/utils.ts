import { Sale, SaleLineItem } from './types';
import { PRODUCTS } from './constants';

/**
 * Calculate the total price for a line item
 */
export function calculateLineItemTotal(quantity: number, price: number): number {
  return quantity * price;
}

/**
 * Calculate the total sale amount
 */
export function calculateSaleTotal(items: SaleLineItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * Format currency to CLP (Chilean Peso)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a summary string from sale items
 * Example: "5×20 + 3×10 + 4×6 + Agua Soda + 50 kilos"
 */
export function generateSaleSummary(items: SaleLineItem[]): string {
  return items
    .map((item) => {
      const product = PRODUCTS[item.productId];
      if (!product) return '';

      if (product.id === 'botellon_20') {
        return `${item.quantity}×20`;
      } else if (product.id === 'bidon_10') {
        return `${item.quantity}×10`;
      } else if (product.id === 'bidon_6') {
        return `${item.quantity}×6`;
      } else if (product.id === 'agua_soda_2') {
        return `${item.quantity} Agua Soda`;
      } else if (product.id === 'hielo_kilo') {
        return `${item.quantity} kilos Hielo`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' + ');
}
