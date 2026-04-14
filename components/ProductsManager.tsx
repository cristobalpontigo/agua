'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  active: boolean;
}

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('unidad');
  const [price, setPrice] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch {
      console.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setUnit('unidad');
    setPrice('');
    setSubmitError(null);
    setSubmitSuccess(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!code.trim()) { setSubmitError('El código es requerido'); return; }
    if (!name.trim()) { setSubmitError('El nombre es requerido'); return; }
    if (!price || parseFloat(price) < 0) { setSubmitError('Ingresa un precio válido'); return; }

    setIsSubmitting(true);
    try {
      const body = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || null,
        unit: unit.trim() || 'unidad',
        price: parseFloat(price),
      };

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSubmitError(d.error || 'Error al guardar');
        return;
      }

      setSubmitSuccess(editingId ? 'Producto actualizado' : 'Producto creado');
      resetForm();
      setShowForm(false);
      await fetchProducts();
    } catch {
      setSubmitError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (p: Product) => {
    setCode(p.code);
    setName(p.name);
    setDescription(p.description || '');
    setUnit(p.unit);
    setPrice(p.price.toString());
    setEditingId(p.id);
    setShowForm(true);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const deleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await fetchProducts();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Productos</h3>
          <p className="text-sm text-slate-500">{products.length} producto{products.length !== 1 ? 's' : ''} activo{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          {showForm ? 'Cancelar' : '+ Nuevo producto'}
        </button>
      </div>

      {submitSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {submitSuccess}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {editingId ? 'Editar producto' : 'Nuevo producto'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Código</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ej: botellon_20"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Botellón 20L"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Descripción (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del producto"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Unidad</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none"
              >
                <option value="unidad">Unidad</option>
                <option value="botellón">Botellón</option>
                <option value="bidón">Bidón</option>
                <option value="botella">Botella</option>
                <option value="kilo">Kilo</option>
                <option value="litro">Litro</option>
                <option value="caja">Caja</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Precio ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3500"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar producto' : 'Crear producto'}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl">📦</p>
          <p className="mt-2 text-sm font-medium text-slate-500">No hay productos registrados</p>
          <p className="mt-1 text-xs text-slate-400">Crea tu primer producto para empezar a vender.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-3 transition active:border-slate-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-base font-bold text-emerald-600">{formatCurrency(p.price)}</span>
                    <span className="text-[10px] text-slate-400">/ {p.unit}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-lg p-2 text-xs text-slate-500 active:bg-slate-100 bg-slate-50"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="rounded-lg p-2 text-xs text-rose-500 active:bg-rose-50 bg-slate-50"
                    title="Desactivar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
