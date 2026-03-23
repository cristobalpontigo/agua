import { getSales, getSalesByDateRange } from './sales';
import { getClients } from './clients';
import { SECTORS } from '@/lib/constants';
import { SaleService } from '@/lib/services/sale.service';

export interface SectorReport {
  sector: string;
  totalSales: number;
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
  clients: string[];
}

export interface ClientReport {
  clientId: string;
  name: string;
  sector: string;
  totalPurchased: number;
  totalSpent: number;
  lastPurchase?: Date;
  purchaseCount: number;
}

export async function getSectorReport(): Promise<SectorReport[]> {
  const sales = await getSales();
  const sectorStats = new Map<string, any>();

  // Initialize all sectors
  Object.values(SECTORS).forEach(sector => {
    sectorStats.set(sector.id, {
      sector: sector.name,
      totalSales: 0,
      totalAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      clients: new Set<string>(),
    });
  });

  // Aggregate sales by sector
  sales.forEach(sale => {
    const stat = sectorStats.get(sale.sector);
    if (stat) {
      stat.totalSales += 1;
      stat.totalAmount += SaleService.calculateTotal(sale.items);
      if (sale.status === 'completada') stat.completedCount += 1;
      if (sale.status === 'pendiente') stat.pendingCount += 1;
      stat.clients.add(sale.clientId);
    }
  });

  // Convert to array and format
  return Array.from(sectorStats.values()).map(stat => ({
    ...stat,
    clients: Array.from(stat.clients),
  }));
}

export async function getClientReport(): Promise<ClientReport[]> {
  const sales = await getSales();
  const clients = await getClients();
  const clientStats = new Map<string, any>();

  // Initialize clients
  clients.forEach(client => {
    clientStats.set(client.id, {
      clientId: client.id,
      name: client.name,
      sector: client.sector,
      totalPurchased: 0,
      totalSpent: 0,
      lastPurchase: undefined,
      purchaseCount: 0,
    });
  });

  // Aggregate sales by client
  sales.forEach(sale => {
    const stat = clientStats.get(sale.clientId);
    if (stat) {
      // Count items
      const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      stat.totalPurchased += itemsCount;
      stat.totalSpent += SaleService.calculateTotal(sale.items);
      stat.purchaseCount += 1;
      
      const saleDate = new Date(sale.createdAt);
      if (!stat.lastPurchase || saleDate > stat.lastPurchase) {
        stat.lastPurchase = saleDate;
      }
    }
  });

  return Array.from(clientStats.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function getMonthlySalesReport(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const sales = await getSalesByDateRange(startDate, endDate);
  
  const days = new Map<number, number>();
  
  for (let i = 1; i <= endDate.getDate(); i++) {
    days.set(i, 0);
  }

  sales.forEach(sale => {
    const saleDate = new Date(sale.createdAt);
    const day = saleDate.getDate();
    const current = days.get(day) || 0;
    days.set(day, current + SaleService.calculateTotal(sale.items));
  });

  return {
    year,
    month,
    totalSales: sales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0),
    transactionCount: sales.length,
    averagePerDay: sales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0) / endDate.getDate(),
    dailyData: Array.from(days.entries()).map(([day, amount]) => ({
      day,
      amount,
    })),
  };
}

export async function getPendingPaymentsReport() {
  const sales = await getSales();
  return sales
    .filter(s => s.status === 'pendiente')
    .map(s => ({
      saleId: s.id,
      clientId: s.clientId,
      sector: s.sector,
      amount: SaleService.calculateTotal(s.items),
      date: s.createdAt,
      daysOverdue: Math.floor(
        (new Date().getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}
