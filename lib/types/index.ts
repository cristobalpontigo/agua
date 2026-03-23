/**
 * TIPOS - Definición de todas las entidades del sistema
 * Limpio, sin duplicación, con relaciones claras
 */

// Product Types
export type ProductType = 'botellon_20' | 'bidon_10' | 'bidon_6' | 'agua_soda_2' | 'hielo_kilo';
export type SectorType = 
  | 'vizcachas' | 'la_obra' | 'vertiente' | 'canelo' | 'manzano' 
  | 'guayacan' | 'san_jose_maipo' | 'el_toyo' | 'melocoton' 
  | 'san_alfonso' | 'el_ingenio' | 'maitenes' | 'alfalfal';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
export type PaymentStatus = 'pendiente' | 'completado' | 'fallido';
export type SaleStatus = 'pendiente' | 'completada' | 'cancelada';
export type DeliveryStatus = 'programada' | 'en_transito' | 'entregada' | 'fallida';

// ENTIDAD: Cliente
export interface Client {
  id: string;
  name: string;
  sector: SectorType;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ENTIDAD: Producto en Venta
export interface SaleLineItem {
  productId: ProductType;
  quantity: number;
  price: number;
  subtotal: number;
}

// ENTIDAD: Pago
export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: Date;
  notes?: string;
}

// ENTIDAD: Venta (SIN DATOS DERIVADOS)
export interface Sale {
  id: string;
  clientId: string; // SOLO REFERENCIA
  sector: SectorType;
  items: SaleLineItem[];
  notes?: string;
  status: SaleStatus;
  createdAt: Date;
  deliveryDate?: Date;
  updatedAt: Date;
  
  // Relaciones (se cargan desde API)
  payments?: Payment[];
  client?: Client;
}

// ENTIDAD: Entrega
export interface Delivery {
  id: string;
  saleId: string;
  clientId: string;
  scheduledDate: Date;
  completedAt?: Date;
  status: DeliveryStatus;
  notes?: string;
  createdAt: Date;
}

// COMPUTED: Valores derivados (NO se guardan)
export interface SaleWithComputed extends Sale {
  readonly total: number;
  readonly paidAmount: number;
  readonly pendingAmount: number;
  readonly isPaid: boolean;
  readonly isOverdue: boolean;
}

// DTO: Respuesta de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
