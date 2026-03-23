/**
 * STORAGE - Gestión de persistencia con localStorage
 * Permite que los datos se guarden localmente
 */

import { Client, Sale, Payment } from '@/lib/types';

const STORAGE_KEYS = {
  SALES: 'aguas_sales',
  CLIENTS: 'aguas_clients',
  PAYMENTS: 'aguas_payments',
  LAST_SYNC: 'aguas_last_sync',
};

// Clase para manejar localStorage de forma segura
export class StorageService {
  static getSales(): Sale[] {
    try {
      const data = localStorage?.getItem(STORAGE_KEYS.SALES);
      return data ? JSON.parse(data) : [];
    } catch {
      console.error('Error al cargar ventas desde storage');
      return [];
    }
  }

  static setSales(sales: Sale[]): void {
    try {
      localStorage?.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      this.updateSyncTime();
    } catch (error) {
      console.error('Error al guardar ventas:', error);
    }
  }

  static addSale(sale: Sale): void {
    const sales = this.getSales();
    sales.unshift(sale);
    this.setSales(sales);
  }

  static updateSale(id: string, updates: Partial<Sale>): void {
    const sales = this.getSales();
    const index = sales.findIndex(s => s.id === id);
    if (index !== -1) {
      sales[index] = { ...sales[index], ...updates, updatedAt: new Date() };
      this.setSales(sales);
    }
  }

  static deleteSale(id: string): void {
    const sales = this.getSales().filter(s => s.id !== id);
    this.setSales(sales);
  }

  // Clientes
  static getClients(): Client[] {
    try {
      const data = localStorage?.getItem(STORAGE_KEYS.CLIENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static setClients(clients: Client[]): void {
    try {
      localStorage?.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      this.updateSyncTime();
    } catch (error) {
      console.error('Error al guardar clientes:', error);
    }
  }

  // Pagos
  static getPayments(): Payment[] {
    try {
      const data = localStorage?.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static setPayments(payments: Payment[]): void {
    try {
      localStorage?.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
      this.updateSyncTime();
    } catch (error) {
      console.error('Error al guardar pagos:', error);
    }
  }

  static updateSyncTime(): void {
    try {
      localStorage?.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Error al actualizar sync time:', error);
    }
  }

  static getLastSyncTime(): Date | null {
    try {
      const sync = localStorage?.getItem(STORAGE_KEYS.LAST_SYNC);
      return sync ? new Date(sync) : null;
    } catch {
      return null;
    }
  }

  // Limpiar todo (útil para testing)
  static clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage?.removeItem(key);
      });
    } catch (error) {
      console.error('Error al limpiar storage:', error);
    }
  }
}
