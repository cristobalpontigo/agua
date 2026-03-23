// Product Types
export type ProductType = 'botellon_20' | 'bidon_10' | 'bidon_6' | 'agua_soda_2' | 'hielo_kilo';

export interface Product {
  id: ProductType;
  name: string;
  description: string;
  quantity: string; // "20 L", "10 L", etc.
  price: number;
  unit: string; // "botellón", "bidón", etc.
}

// Customer/Client Type
export interface Client {
  id: string;
  name: string;
  sector: SectorType;
  phone?: string;
  email?: string;
  address?: string;
  billingDay?: number; // Día de facturación mensual (1-31)
  createdAt: Date;
  updatedAt: Date;
}

// Sector Types
export type SectorType = 
  | 'vizcachas'
  | 'la_obra'
  | 'vertiente'
  | 'canelo'
  | 'manzano'
  | 'guayacan'
  | 'san_jose_maipo'
  | 'el_toyo'
  | 'melocoton'
  | 'san_alfonso'
  | 'el_ingenio'
  | 'maitenes'
  | 'alfalfal';

export interface Sector {
  id: SectorType;
  name: string;
}

// Sale Line Item
export interface SaleLineItem {
  productId: ProductType;
  quantity: number;
  price: number;
  subtotal: number;
}

// Payment Type
export type PaymentMethod = 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
export type PaymentStatus = 'pendiente' | 'completado' | 'fallido';

export interface Payment {
  id: string;
  saleId: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: Date;
  notes?: string;
}

// Delivery Type
export interface Delivery {
  id: string;
  saleId: string;
  clientId: string;
  scheduledDate: Date;
  completedAt?: Date;
  status: 'programada' | 'en_transito' | 'entregada' | 'fallida';
  notes?: string;
}

// Sale/Transaction
export interface Sale {
  id: string;
  clientId: string;
  clientName?: string;  // Opcional para compatibilidad
  sector: SectorType;
  items: SaleLineItem[];
  notes?: string;
  status: 'pendiente' | 'completada' | 'cancelada';
  createdAt: Date;
  deliveryDate?: Date;
  updatedAt: Date;
  date?: Date;  // Alias de createdAt para compatibilidad
  total?: number;  // Computed from items
  payments?: Payment[];
  client?: Client;
  delivery?: Delivery;
}
