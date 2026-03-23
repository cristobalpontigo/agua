import { readDb, writeDb } from './storage';
import { Sale } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';

export interface SaleDBRecord extends Omit<Sale, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface SaleDB {
  [id: string]: SaleDBRecord;
}

export async function getSales(): Promise<Sale[]> {
  const db = await readDb<SaleDB>('sales');
  return Object.values(db).map(sale => ({
    ...sale,
    createdAt: new Date(sale.createdAt),
    updatedAt: new Date(sale.updatedAt),
  })).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getSaleById(id: string): Promise<Sale | null> {
  const db = await readDb<SaleDB>('sales');
  const sale = db[id];
  if (!sale) return null;
  return {
    ...sale,
    createdAt: new Date(sale.createdAt),
    updatedAt: new Date(sale.updatedAt),
  };
}

export async function getSalesByClient(clientId: string): Promise<Sale[]> {
  const db = await readDb<SaleDB>('sales');
  return Object.values(db)
    .filter(s => s.clientId === clientId)
    .map(sale => ({
      ...sale,
      createdAt: new Date(sale.createdAt),
      updatedAt: new Date(sale.updatedAt),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSalesBySector(sector: string): Promise<Sale[]> {
  const db = await readDb<SaleDB>('sales');
  return Object.values(db)
    .filter(s => s.sector === sector)
    .map(sale => ({
      ...sale,
      createdAt: new Date(sale.createdAt),
      updatedAt: new Date(sale.updatedAt),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
  const db = await readDb<SaleDB>('sales');
  return Object.values(db)
    .filter(s => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    })
    .map(sale => ({
      ...sale,
      createdAt: new Date(sale.createdAt),
      updatedAt: new Date(sale.updatedAt),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createSale(data: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> {
  const db = await readDb<SaleDB>('sales');
  
  const now = new Date();
  const saleData: SaleDBRecord = {
    id: generateId(),
    ...data,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  
  db[saleData.id] = saleData;
  await writeDb('sales', db);
  
  return {
    ...saleData,
    createdAt: now,
    updatedAt: now,
  } as Sale;
}

export async function updateSale(id: string, data: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Sale | null> {
  const db = await readDb<SaleDB>('sales');
  
  if (!db[id]) return null;
  
  const updated: SaleDBRecord = {
    ...db[id],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  db[id] = updated;
  await writeDb('sales', db);
  
  return {
    ...updated,
    createdAt: new Date(updated.createdAt),
    updatedAt: new Date(updated.updatedAt),
  } as Sale;
}

export async function deleteSale(id: string): Promise<boolean> {
  const db = await readDb<SaleDB>('sales');
  
  if (!db[id]) return false;
  
  delete db[id];
  await writeDb('sales', db);
  
  return true;
}

export async function getTotalSales(): Promise<number> {
  const sales = await getSales();
  return sales.reduce((sum, sale) => sum + SaleService.calculateTotal(sale.items), 0);
}

export async function getTotalSalesByStatus(status: string): Promise<number> {
  const sales = await getSales();
  return sales
    .filter(s => s.status === status)
    .reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
}

export async function getSaleStats() {
  const sales = await getSales();
  const total = sales.reduce((sum, s) => sum + SaleService.calculateTotal(s.items), 0);
  const completed = sales.filter(s => s.status === 'completada').length;
  const pending = sales.filter(s => s.status === 'pendiente').length;
  const cancelled = sales.filter(s => s.status === 'cancelada').length;

  return { total, completed, pending, cancelled, count: sales.length };
}
