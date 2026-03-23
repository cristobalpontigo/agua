'use client';

import { useState } from 'react';
import { Client } from '@/lib/types';
import { useClients } from '@/lib/hooks/useApi';

export function SimpleClientManager() {
  const { data, loading, error } = useClients();
  const clients = (data as any[]) || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    sector: 'la_obra',
    billingDay: 10,
  });

  const handleAddClient = async () => {
    if (!formData.name.trim()) return;

    try {
      // Send to API (simplified version - use useCreateClient in production)
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          sector: 'la_obra',
          billingDay: 10,
        });
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  const sectorNames: Record<string, string> = {
    vizcachas: 'Vizcachas',
    la_obra: 'La Obra',
    vertiente: 'Vertiente',
    canelo: 'Cañelo',
    manzano: 'Manzano',
    guayacan: 'Guayacán',
    san_jose_maipo: 'San José de Maipo',
    el_toyo: 'El Toyo',
    melocoton: 'Melicotón',
    san_alfonso: 'San Alfonso',
    el_ingenio: 'El Ingenio',
    maitenes: 'Maitenos',
    alfalfal: 'Alfalfal',
  };

  if (loading) return <div className="text-white">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gestión de Clientes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          {showForm ? '✕ Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />

            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />

            <input
              type="text"
              placeholder="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />

            <select
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              {Object.entries(sectorNames).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Día de Facturación</label>
              <select
                value={formData.billingDay}
                onChange={(e) => setFormData({ ...formData, billingDay: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAddClient}
            className="mt-4 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
          >
            Guardar Cliente
          </button>
        </div>
      )}

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{client.name}</h3>
                <p className="text-sm text-slate-600">{sectorNames[client.sector as keyof typeof sectorNames]}</p>
              </div>
              <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-sm">
                {client.billingDay || 10}
              </div>
            </div>

            {client.phone && <p className="text-sm text-slate-700 mb-1">📱 {client.phone}</p>}
            {client.email && <p className="text-sm text-slate-700 mb-1">✉️ {client.email}</p>}
            {client.address && <p className="text-sm text-slate-700">📍 {client.address}</p>}

            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-600">Factura día {client.billingDay || 10} de cada mes</p>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && !showForm && (
        <div className="bg-slate-100 rounded-lg p-8 text-center">
          <p className="text-slate-600 mb-4">No hay clientes registrados</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            Agregar primer cliente
          </button>
        </div>
      )}
    </div>
  );
}
