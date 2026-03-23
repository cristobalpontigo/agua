'use client';

import { useState } from 'react';
import { Sale, Client } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { SaleService } from '@/lib/services/sale.service';

interface SimpleSaleFormProps {
  clients: Client[];
  onSaleCreated?: () => void;
}

export function SimpleSaleForm({ clients, onSaleCreated }: SimpleSaleFormProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [items, setItems] = useState<{ product: string; quantity: number; price: number }[]>([]);
  const [notes, setNotes] = useState('');

  const products = [
    { id: 'botellon_20', name: 'Botellón 20L', defaultPrice: 3500 },
    { id: 'bidon_10', name: 'Bidón 10L', defaultPrice: 2000 },
    { id: 'bidon_6', name: 'Bidón 6L', defaultPrice: 1500 },
    { id: 'agua_soda_2', name: 'Agua/Soda 2L', defaultPrice: 800 },
    { id: 'hielo_kilo', name: 'Hielo Kg', defaultPrice: 500 },
  ];

  const handleAddItem = () => {
    setItems([...items, { product: 'botellon_20', quantity: 1, price: 3500 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSumbit = async () => {
    if (!selectedClient || items.length === 0) {
      alert('Selecciona un cliente y agrega productos');
      return;
    }

    try {
      const saleData = {
        clientId: selectedClient,
        items: items.map(item => {
          const product = products.find(p => p.id === item.product);
          return {
            productId: item.product,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
          };
        }),
        notes,
        status: 'completada',
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (res.ok) {
        setSelectedClient('');
        setItems([]);
        setNotes('');
        onSaleCreated?.();
      }
    } catch (err) {
      console.error('Error creating sale:', err);
    }
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="space-y-4">
      {/* Cliente */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Cliente</label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Selecciona un cliente...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {/* Productos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-900">Productos</label>
          <button
            onClick={handleAddItem}
            className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
          >
            + Agregar
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                value={item.product}
                onChange={(e) => {
                  const newItems = [...items];
                  const product = products.find(p => p.id === e.target.value);
                  newItems[idx] = { ...item, product: e.target.value, price: product?.defaultPrice || 0 };
                  setItems(newItems);
                }}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-sm"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx] = { ...item, quantity: parseInt(e.target.value) || 1 };
                  setItems(newItems);
                }}
                className="w-16 px-2 py-2 bg-white border border-slate-300 rounded text-slate-900 text-sm text-center"
              />

              <span className="text-slate-700 text-sm min-w-[80px] text-right">{formatCurrency(item.quantity * item.price)}</span>

              <button
                onClick={() => handleRemoveItem(idx)}
                className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas sobre la venta..."
          className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none h-20"
        />
      </div>

      {/* Resumen */}
      {items.length > 0 && (
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-700">Items:</span>
            <span className="text-slate-900 font-semibold">{items.length}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-300">
            <span className="text-slate-700">Subtotal:</span>
            <span className="text-slate-900 font-semibold">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-slate-900">Total:</span>
            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Botón guardar */}
      <button
        onClick={handleSumbit}
        disabled={!selectedClient || items.length === 0}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
      >
        Guardar Venta
      </button>
    </div>
  );
}
