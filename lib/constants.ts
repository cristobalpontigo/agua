import { Product, Sector, SectorType, ProductType } from './types';

// PRODUCTS DATABASE
export const PRODUCTS: Record<ProductType, Product> = {
  botellon_20: {
    id: 'botellon_20',
    name: 'Botellón 20 L',
    description: 'Botellón de agua de 20 litros',
    quantity: '20 L',
    price: 3000,
    unit: 'botellón',
  },
  bidon_10: {
    id: 'bidon_10',
    name: 'Bidón 10 L',
    description: 'Bidón de agua de 10 litros',
    quantity: '10 L',
    price: 1800,
    unit: 'bidón',
  },
  bidon_6: {
    id: 'bidon_6',
    name: 'Bidón 6 L',
    description: 'Bidón de agua de 6 litros',
    quantity: '6 L',
    price: 1200,
    unit: 'bidón',
  },
  agua_soda_2: {
    id: 'agua_soda_2',
    name: 'Agua Soda 2 L',
    description: 'Agua soda desechable de 2 litros',
    quantity: '2 L',
    price: 2000,
    unit: 'botella',
  },
  hielo_kilo: {
    id: 'hielo_kilo',
    name: 'Hielo por Kilo',
    description: 'Hielo en cubos',
    quantity: '1 kilo',
    price: 1500,
    unit: 'kilo',
  },
};

// SECTORS DATABASE
export const SECTORS: Record<SectorType, Sector> = {
  vizcachas: { id: 'vizcachas', name: 'Vizcachas' },
  la_obra: { id: 'la_obra', name: 'La Obra' },
  vertiente: { id: 'vertiente', name: 'Vertiente' },
  canelo: { id: 'canelo', name: 'Cañelo' },
  manzano: { id: 'manzano', name: 'Manzano' },
  guayacan: { id: 'guayacan', name: 'Guayacán' },
  san_jose_maipo: { id: 'san_jose_maipo', name: 'San José de Maipo' },
  el_toyo: { id: 'el_toyo', name: 'El Toyo' },
  melocoton: { id: 'melocoton', name: 'Melocotón' },
  san_alfonso: { id: 'san_alfonso', name: 'San Alfonso' },
  el_ingenio: { id: 'el_ingenio', name: 'El Ingenio' },
  maitenes: { id: 'maitenes', name: 'Maitenes' },
  alfalfal: { id: 'alfalfal', name: 'Alfalfal' },
};

// SAMPLE CLIENTS
export const SAMPLE_CLIENTS = [
  { name: 'Cristobal', sector: 'vizcachas' as SectorType },
  { name: 'Marcelo', sector: 'la_obra' as SectorType },
  { name: 'Maria', sector: 'vertiente' as SectorType },
  { name: 'Osvaldo', sector: 'canelo' as SectorType },
  { name: 'Hugo', sector: 'manzano' as SectorType },
];

// Payment Methods (Spanish)
export const PAYMENT_METHODS = ['efectivo', 'transferencia', 'cheque', 'tarjeta'] as const;

// Sale Statuses (Spanish)
export const SALE_STATUSES = ['pendiente', 'completada', 'cancelada'] as const;
