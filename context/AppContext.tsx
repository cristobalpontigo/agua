/**
 * CONTEXT API - Estado global de la aplicación
 * Comparte datos entre componentes sin prop drilling
 */

'use client';

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { Sale, Payment, Client } from '@/lib/types';
import { StorageService } from '@/lib/storage/localStorage';
import { SaleService } from '@/lib/services/sale.service';

interface AppContextType {
  // Estado
  sales: Sale[];
  payments: Payment[];
  clients: Client[];
  loading: boolean;

  // Actions - Ventas
  addSale: (sale: Sale) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  
  // Actions - Pagos
  addPayment: (payment: Payment) => void;
  getPaymentsBySaleId: (saleId: string) => Payment[];
  
  // Actions - Clientes
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Utils
  refreshData: () => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sales, setSalesState] = useState<Sale[]>([]);
  const [payments, setPaymentsState] = useState<Payment[]>([]);
  const [clients, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos al montar
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    try {
      setLoading(true);
      setSalesState(StorageService.getSales());
      setPaymentsState(StorageService.getPayments());
      setClientsState(StorageService.getClients());
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setSales = useCallback((sales: Sale[]) => {
    setSalesState(sales);
    StorageService.setSales(sales);
  }, []);

  const setPayments = useCallback((payments: Payment[]) => {
    setPaymentsState(payments);
    StorageService.setPayments(payments);
  }, []);

  const setClients = useCallback((clients: Client[]) => {
    setClientsState(clients);
    StorageService.setClients(clients);
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

  const addPayment = useCallback((payment: Payment) => {
    setPayments([...payments, payment]);
  }, [payments, setPayments]);

  const getPaymentsBySaleId = useCallback((saleId: string): Payment[] => {
    return payments.filter(p => p.saleId === saleId);
  }, [payments]);

  const addClient = useCallback((client: Client) => {
    setClients([...clients, client]);
  }, [clients, setClients]);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    const updated = clients.map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
    );
    setClients(updated);
  }, [clients, setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients(clients.filter(c => c.id !== id));
  }, [clients, setClients]);

  const clearAll = useCallback(() => {
    StorageService.clear();
    setSalesState([]);
    setPaymentsState([]);
    setClientsState([]);
  }, []);

  const value: AppContextType = {
    sales,
    payments,
    clients,
    loading,
    addSale,
    updateSale,
    deleteSale,
    addPayment,
    getPaymentsBySaleId,
    addClient,
    updateClient,
    deleteClient,
    refreshData,
    clearAll,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook para usar el context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider');
  }
  return context;
}
