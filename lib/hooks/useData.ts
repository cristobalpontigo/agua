/**
 * HOOKS PERSONALIZADOS - Reutilizar lógica en múltiples componentes
 * Reemplazan useState con lógica compleja
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sale, Payment, Client } from '@/lib/types';
import { StorageService } from '@/lib/storage/localStorage';
import { SaleService } from '@/lib/services/sale.service';

// Hook para gestionar ventas
export function useSales() {
  const [sales, setSalesState] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar ventas del storage al montar
  useEffect(() => {
    try {
      const stored = StorageService.getSales();
      setSalesState(stored);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setSales = useCallback((sales: Sale[]) => {
    setSalesState(sales);
    StorageService.setSales(sales);
  }, []);

  const addSale = useCallback((sale: Sale) => {
    setSales([sale, ...sales]);
  }, [sales, setSales]);

  const updateSale = useCallback((id: string, updates: Partial<Sale>) => {
    const updated = sales.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
    );
    setSales(updated);
  }, [sales, setSales]);

  const deleteSale = useCallback((id: string) => {
    setSales(sales.filter(s => s.id !== id));
  }, [sales, setSales]);

  const getSaleById = useCallback((id: string) => {
    return sales.find(s => s.id === id);
  }, [sales]);

  return {
    sales,
    setSales,
    addSale,
    updateSale,
    deleteSale,
    getSaleById,
    loading,
  };
}

// Hook para gestionar pagos
export function usePayments() {
  const [payments, setPaymentsState] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = StorageService.getPayments();
      setPaymentsState(stored);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setPayments = useCallback((payments: Payment[]) => {
    setPaymentsState(payments);
    StorageService.setPayments(payments);
  }, []);

  const addPayment = useCallback((payment: Payment) => {
    setPayments([...payments, payment]);
  }, [payments, setPayments]);

  const getPaymentsBySaleId = useCallback((saleId: string) => {
    return payments.filter(p => p.saleId === saleId);
  }, [payments]);

  return {
    payments,
    setPayments,
    addPayment,
    getPaymentsBySaleId,
    loading,
  };
}

// Hook para gestionar clientes
export function useClients() {
  const [clients, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = StorageService.getClients();
      setClientsState(stored);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setClients = useCallback((clients: Client[]) => {
    setClientsState(clients);
    StorageService.setClients(clients);
  }, []);

  const addClient = useCallback((client: Client) => {
    setClients([...clients, client]);
  }, [clients, setClients]);

  const getClientById = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  return {
    clients,
    setClients,
    addClient,
    getClientById,
    loading,
  };
}

// Hook para validación y errores
export function useFormState() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const clearErrors = useCallback(() => setErrors({}), []);
  const clearSuccess = useCallback(() => setSuccessMessage(''), []);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  return {
    errors,
    isSubmitting,
    successMessage,
    setErrors,
    setError,
    clearErrors,
    setIsSubmitting,
    setSuccessMessage,
    clearSuccess,
  };
}

// Hook para cálculos de venta
export function useSaleCalculations(sale: Sale, payments: Payment[] = []) {
  const total = SaleService.calculateTotal(sale.items);
  const paidAmount = SaleService.calculatePaidAmount(payments);
  const pendingAmount = SaleService.calculatePendingAmount(total, paidAmount);
  const isPaid = SaleService.isPaid(total, paidAmount);
  const isOverdue = SaleService.isOverdue(sale, paidAmount, total);

  return {
    total,
    paidAmount,
    pendingAmount,
    isPaid,
    isOverdue,
    paymentPercentage: total > 0 ? (paidAmount / total) * 100 : 0,
  };
}
