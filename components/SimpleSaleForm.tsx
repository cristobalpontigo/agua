'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ApiProduct {
  id: string;
  code: string;
  name: string;
  price: number;
}

interface SimpleSaleFormProps {
  clients: Client[];
  onSaleCreated?: () => void;
}

export function SimpleSaleForm({ clients, onSaleCreated }: SimpleSaleFormProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [items, setItems] = useState<{ product: string; quantity: number; price: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string; defaultPrice: number }[]>([]);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiProduct[]) => {
        if (data.length > 0) {
          setProducts(data.map(p => ({ id: p.code, name: p.name, defaultPrice: p.price })));
        } else {
          // Fallback if no products in DB yet
          setProducts([
            { id: 'botellon_20', name: 'Botellón 20L', defaultPrice: 3500 },
            { id: 'bidon_10', name: 'Bidón 10L', defaultPrice: 2000 },
            { id: 'bidon_6', name: 'Bidón 6L', defaultPrice: 1500 },
            { id: 'agua_soda_2', name: 'Agua/Soda 2L', defaultPrice: 800 },
            { id: 'hielo_kilo', name: 'Hielo Kg', defaultPrice: 500 },
          ]);
        }
      })
      .catch(() => {
        setProducts([
          { id: 'botellon_20', name: 'Botellón 20L', defaultPrice: 3500 },
          { id: 'bidon_10', name: 'Bidón 10L', defaultPrice: 2000 },
          { id: 'bidon_6', name: 'Bidón 6L', defaultPrice: 1500 },
          { id: 'agua_soda_2', name: 'Agua/Soda 2L', defaultPrice: 800 },
          { id: 'hielo_kilo', name: 'Hielo Kg', defaultPrice: 500 },
        ]);
      });
  }, []);

  const handleAddItem = () => {
    const first = products[0];
    setItems([...items, { product: first?.id || 'botellon_20', quantity: 1, price: first?.defaultPrice || 3500 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSumbit = async () => {
    setSubmitError(null);

    if (clients.length === 0) {
      setSubmitError('No hay clientes disponibles. Crea un cliente primero.');
      return;
    }

    if (!selectedClient || items.length === 0) {
      setSubmitError('Selecciona un cliente y agrega productos.');
      return;
    }

    try {
      const saleItems = items.map(item => ({
        productId: item.product,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
      }));

      const saleData = {
        clientId: selectedClient,
        saleItems,
        total,
        notes,
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
      } else {
        const errorData = await res.json().catch(() => ({}));
        setSubmitError(errorData.error || 'No fue posible crear la venta.');
      }
    } catch (err) {
      console.error('Error creating sale:', err);
      setSubmitError('Error de conexión al crear la venta.');
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
          disabled={clients.length === 0}
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
        >
          <option value="">{clients.length === 0 ? 'No hay clientes disponibles' : 'Selecciona un cliente...'}</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {submitError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {submitError}
        </div>
      )}

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

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-2">
              <div className="flex gap-2 items-center">
                <select
                  value={item.product}
                  onChange={(e) => {
                    const newItems = [...items];
                    const product = products.find(p => p.id === e.target.value);
                    newItems[idx] = { ...item, product: e.target.value, price: product?.defaultPrice || 0 };
                    setItems(newItems);
                  }}
                  className="flex-1 px-2 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="px-2.5 py-2.5 bg-red-600 active:bg-red-700 text-white rounded-lg text-sm shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newItems = [...items];
                      newItems[idx] = { ...item, quantity: Math.max(1, item.quantity - 1) };
                      setItems(newItems);
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-lg text-slate-700 font-bold text-lg active:bg-slate-300"
                  >−</button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx] = { ...item, quantity: parseInt(e.target.value) || 1 };
                      setItems(newItems);
                    }}
                    className="w-14 px-1 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm text-center"
                  />
                  <button
                    onClick={() => {
                      const newItems = [...items];
                      newItems[idx] = { ...item, quantity: item.quantity + 1 };
                      setItems(newItems);
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-lg text-slate-700 font-bold text-lg active:bg-slate-300"
                  >+</button>
                </div>
                <span className="ml-auto text-base font-bold text-emerald-700">{formatCurrency(item.quantity * item.price)}</span>
              </div>
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
        className="w-full px-4 py-4 bg-blue-600 active:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition active:scale-[0.98]"
      >
        Guardar Venta
      </button>
    </div>
  );
}
