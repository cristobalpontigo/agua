'use client';

import { useState } from 'react';
import { useClients } from '@/lib/hooks/useApi';

export function SimpleClientManager() {
  const { data, loading, error, refetch } = useClients();
  const clients = (data as any[]) || [];
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const startEdit = (client: any) => {
    setEditingId(client.id);
    setEditError(null);
    setEditData({
      contactName: client.contactName || '',
      phone: client.phone || '',
      address: client.address || '',
      email: client.email || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const saveEdit = async (clientId: string) => {
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo guardar');
      }
      await refetch();
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || 'Error al guardar');
    } finally {
      setIsSavingEdit(false);
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    sector: 'la_obra',
    billingDay: 10,
  });

  const handleAddClient = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setSubmitError('El nombre del cliente es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      // Send to API (simplified version - use useCreateClient in production)
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: trimmedName,
        }),
      });

      if (res.ok) {
        await refetch();
        setFormData({
          name: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          sector: 'la_obra',
          billingDay: 10,
        });
        setSubmitSuccess('Cliente creado correctamente.');
        setShowForm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || 'No fue posible crear el cliente.');
      }
    } catch (err) {
      console.error('Error creating client:', err);
      setSubmitError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
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

  if (loading) return <div className="text-slate-700">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Clientes</h2>
        <button
          onClick={() => {
            setSubmitError(null);
            setSubmitSuccess(null);
            setShowForm(!showForm);
          }}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          {showForm ? '✕ Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Error al cargar clientes: {error}
        </div>
      )}

      {submitSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {submitSuccess}
        </div>
      )}

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
              type="text"
              placeholder="Persona de contacto"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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

          {submitError && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {submitError}
            </div>
          )}

          <button
            onClick={handleAddClient}
            disabled={isSubmitting}
            className="mt-4 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
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
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-sm">
                  {client.billingDay || 10}
                </div>
              </div>
            </div>

            {editingId === client.id ? (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  placeholder="Persona de contacto"
                  value={editData.contactName}
                  onChange={(e) => setEditData({ ...editData, contactName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dirección"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                {editError && (
                  <p className="text-xs text-rose-700">{editError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(client.id)}
                    disabled={isSavingEdit}
                    className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition disabled:opacity-60"
                  >
                    {isSavingEdit ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isSavingEdit}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {client.contactName && <p className="text-sm text-slate-700 mb-1">👤 {client.contactName}</p>}
                {client.phone && <p className="text-sm text-slate-700 mb-1">📱 {client.phone}</p>}
                {client.email && <p className="text-sm text-slate-700 mb-1">✉️ {client.email}</p>}
                {client.address && <p className="text-sm text-slate-700">📍 {client.address}</p>}

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-600">Factura día {client.billingDay || 10} de cada mes</p>
                  <button
                    onClick={() => startEdit(client)}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                  >
                    ✏️ Editar
                  </button>
                </div>
              </>
            )}
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
