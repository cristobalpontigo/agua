/**
 * VALIDACIONES - Esquemas Zod para validar datos
 * Asegura que todos los datos sean correctos antes de guardar
 */

import { z } from 'zod';
import { PRODUCTS, SECTORS, PAYMENT_METHODS, SALE_STATUSES } from '@/lib/constants';

// Validar Cliente
export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nombre debe tener mínimo 2 caracteres').max(100),
  sector: z.enum(Object.keys(SECTORS) as any),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

// Validar Producto en Venta
export const SaleLineItemSchema = z.object({
  productId: z.enum(Object.keys(PRODUCTS) as any),
  quantity: z.number().int().min(1, 'Cantidad debe ser mayor a 0'),
  price: z.number().positive(),
  subtotal: z.number().positive(),
});

// Validar Venta (Crear/Actualizar)
export const SaleSchema = z.object({
  clientId: z.string().min(1, 'Cliente es requerido'),
  sector: z.enum(Object.keys(SECTORS) as any),
  items: z.array(SaleLineItemSchema).min(1, 'Debe agregar al menos 1 producto'),
  notes: z.string().optional(),
  status: z.enum(SALE_STATUSES as any).default('pendiente'),
  deliveryDate: z.date().optional(),
});

// Validar Pago
export const PaymentSchema = z.object({
  saleId: z.string().min(1),
  amount: z.number().positive('Monto debe ser mayor a 0'),
  method: z.enum(PAYMENT_METHODS as any),
  status: z.enum(['pendiente', 'completado', 'fallido']).default('completado'),
  notes: z.string().optional(),
});

// Tipos derivados de Zod
export type ClientFormData = z.infer<typeof ClientSchema>;
export type SaleFormData = z.infer<typeof SaleSchema>;
export type PaymentFormData = z.infer<typeof PaymentSchema>;

// Función auxiliar para validar
export async function validateSchema<T>(schema: z.Schema<T>, data: unknown): Promise<{ valid: boolean; data?: T; error?: string }> {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Error en validación' };
    }
    return { valid: false, error: 'Error desconocido en validación' };
  }
}
