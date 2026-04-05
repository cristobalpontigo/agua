'use client';

import { useEffect, useState } from 'react';
import { useClients } from '@/lib/hooks/useApi';
import { PRODUCTS } from '@/lib/constants';
import { ProductType } from '@/lib/types';
import { SaleService } from '@/lib/services/sale.service';
import { formatCurrency } from '@/lib/utils';

type RecurringOrderConfig = {
  productId: ProductType;
  quantity: number;
  frequency: 'semanal' | 'quincenal' | 'mensual';
};

interface SimpleClientManagerProps {
  sales?: any[];
}

export function SimpleClientManager({ sales = [] }: SimpleClientManagerProps) {
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recurringOrders, setRecurringOrders] = useState<Record<string, RecurringOrderConfig>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('agua.recurringOrders');
      if (stored) {
        setRecurringOrders(JSON.parse(stored));
      }
    } catch {
      setRecurringOrders({});
    }
  }, []);

  const saveRecurringOrder = (clientId: string, nextConfig: RecurringOrderConfig) => {
    const updated = { ...recurringOrders, [clientId]: nextConfig };
    setRecurringOrders(updated);
    localStorage.setItem('agua.recurringOrders', JSON.stringify(updated));
    setSubmitSuccess('Pedido recurrente guardado.');
  };

  const generateRecurringSale = async (clientId: string) => {
    const config = recurringOrders[clientId];
    if (!config) {
      setSubmitError('Primero guarda una configuración de pedido recurrente.');
      return;
    }

    const product = PRODUCTS[config.productId];
    const quantity = Math.max(1, Number(config.quantity || 1));
    const subtotal = product.price * quantity;

    try {
      setSubmitError(null);
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          saleItems: [
            {
              productId: config.productId,
              quantity,
              price: product.price,
              subtotal,
            },
          ],
          total: subtotal,
          notes: `Pedido recurrente (${config.frequency})`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'No fue posible crear la venta recurrente');
      }

      setSubmitSuccess('Venta recurrente creada correctamente.');
    } catch (err: any) {
      setSubmitError(err.message || 'Error al crear venta recurrente');
    }
  };

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

  const deactivateClient = async (clientId: string) => {
    setDeletingId(clientId);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo desactivar el cliente');
      }
      await refetch();
      setSubmitSuccess('Cliente desactivado correctamente.');
    } catch (err: any) {
      setSubmitError(err.message || 'Error al desactivar cliente');
    } finally {
      setDeletingId(null);
    }
  };

  const getPendingAmount = (clientId: string): number => {
    return sales
      .filter(s => s.clientId === clientId && s.status === 'pendiente')
      .reduce((sum, s) => sum + SaleService.calculateTotal(s.items || s.saleItems || []), 0);
  };

  const openWhatsAppCobro = (client: any) => {
    if (!client.phone) return;
    let phone = client.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.slice(1);
    if (!phone.startsWith('56')) phone = '56' + phone;
    const debt = getPendingAmount(client.id);
    const name = client.contactName || client.name;
    const msg = debt > 0
      ? `Hola ${name}, te escribimos de AGUAS. Tienes un saldo pendiente de $${debt.toLocaleString('es-CL')}. \u00bfPodemos coordinar el pago? Gracias.`
      : `Hola ${name}, te escribimos de AGUAS. Quedamos al d\u00eda con los pagos. \u00a1Gracias por tu preferencia!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
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

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-slate-600">Factura día {client.billingDay || 10} de cada mes</p>
                      <p className="text-[11px] text-slate-500">Historial: {client._count?.sales || 0} venta(s), {client._count?.payments || 0} pago(s)</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(client)}
                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deactivateClient(client.id)}
                        disabled={deletingId === client.id}
                        className="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition disabled:opacity-60"
                      >
                        {deletingId === client.id ? '...' : 'Desactivar'}
                      </button>
                    </div>
                  </div>

                  {/* Saldo pendiente + WhatsApp */}
                  {(() => {
                    const pending = getPendingAmount(client.id);
                    return (
                      <div className={`flex items-center justify-between rounded-lg px-3 py-2 mb-2 ${
                        pending > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'
                      }`}>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saldo pendiente</p>
                          <p className={`text-sm font-bold ${pending > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {pending > 0 ? formatCurrency(pending) : 'Al día ✓'}
                          </p>
                        </div>
                        {client.phone && (
                          <button
                            onClick={() => openWhatsAppCobro(client)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#25D366] text-white hover:bg-[#1ebe59] transition"
                            title="Enviar mensaje de cobro por WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Cobrar
                          </button>
                        )}
                      </div>
                    );
                  })()}

                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Pedido recurrente</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <select
                      value={recurringOrders[client.id]?.productId || 'botellon_20'}
                      onChange={(e) =>
                        saveRecurringOrder(client.id, {
                          productId: e.target.value as ProductType,
                          quantity: recurringOrders[client.id]?.quantity || 1,
                          frequency: recurringOrders[client.id]?.frequency || 'semanal',
                        })
                      }
                      className="px-2 py-1.5 text-xs border border-slate-300 rounded"
                    >
                      {Object.values(PRODUCTS).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={recurringOrders[client.id]?.quantity || 1}
                      onChange={(e) =>
                        saveRecurringOrder(client.id, {
                          productId: recurringOrders[client.id]?.productId || 'botellon_20',
                          quantity: parseInt(e.target.value || '1'),
                          frequency: recurringOrders[client.id]?.frequency || 'semanal',
                        })
                      }
                      className="px-2 py-1.5 text-xs border border-slate-300 rounded"
                      placeholder="Cantidad"
                    />
                    <select
                      value={recurringOrders[client.id]?.frequency || 'semanal'}
                      onChange={(e) =>
                        saveRecurringOrder(client.id, {
                          productId: recurringOrders[client.id]?.productId || 'botellon_20',
                          quantity: recurringOrders[client.id]?.quantity || 1,
                          frequency: e.target.value as RecurringOrderConfig['frequency'],
                        })
                      }
                      className="px-2 py-1.5 text-xs border border-slate-300 rounded"
                    >
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                    </select>
                  </div>
                  <button
                    onClick={() => generateRecurringSale(client.id)}
                    className="mt-2 w-full px-3 py-1.5 text-xs font-semibold rounded border border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 transition"
                  >
                    Generar venta recurrente ahora
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
