/**
 * GESTOR DE CLIENTES - Crear, editar, listar clientes
 * UI moderna con CRUD completo
 */

'use client';

import { useState } from 'react';
import { Client, SectorType } from '@/lib/types';
import { SECTORS } from '@/lib/constants';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { IdGeneratorService } from '@/lib/services/sale.service';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Button, Card, Badge } from '@/components/ui/FormComponents';

export function ClientManager() {
  const { clients, addClient, updateClient, deleteClient } = useAppContext();
  const { addToast } = useToast();

  // Estado
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<SectorType | ''>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sector: 'vizcachas' as SectorType,
    phone: '',
    email: '',
    address: '',
  });

  // Filtrar clientes
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = !filterSector || c.sector === filterSector;
    return matchesSearch && matchesSector;
  });

  // Crear/Editar cliente
  const handleSubmit = () => {
    if (!formData.name) {
      addToast('El nombre es requerido', 'error');
      return;
    }

    try {
      if (editingClient) {
        updateClient(editingClient.id, {
          name: formData.name,
          sector: formData.sector,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });
        addToast(`✓ Cliente ${formData.name} actualizado`, 'success');
      } else {
        const newClient: Client = {
          id: IdGeneratorService.client(),
          name: formData.name,
          sector: formData.sector,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addClient(newClient);
        addToast(`✓ Cliente ${formData.name} creado`, 'success');
      }

      // Reset
      setFormData({ name: '', sector: 'vizcachas', phone: '', email: '', address: '' });
      setShowNewModal(false);
      setEditingClient(null);
    } catch (error) {
      addToast('Error al guardar cliente', 'error');
    }
  };

  // Eliminar cliente
  const handleDelete = (id: string) => {
    deleteClient(id);
    addToast('✕ Cliente eliminado', 'info');
    setShowDeleteConfirm(null);
  };

  // Preparar edición
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      sector: client.sector,
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
    });
    setShowNewModal(true);
  };

  // Abrir modal nuevo
  const handleNewClient = () => {
    setEditingClient(null);
    setFormData({ name: '', sector: 'vizcachas', phone: '', email: '', address: '' });
    setShowNewModal(true);
  };

  const sectorColor: Record<SectorType, string> = {
    vizcachas: 'bg-blue-600',
    la_obra: 'bg-green-600',
    vertiente: 'bg-yellow-600',
    canelo: 'bg-red-600',
    manzano: 'bg-purple-600',
    guayacan: 'bg-pink-600',
    san_jose_maipo: 'bg-indigo-600',
    el_toyo: 'bg-orange-600',
    melocoton: 'bg-cyan-600',
    san_alfonso: 'bg-teal-600',
    el_ingenio: 'bg-lime-600',
    maitenes: 'bg-rose-600',
    alfalfal: 'bg-fuchsia-600',
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="🔍 Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="col-span-1 md:col-span-2"
        />
        <Select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value as SectorType | '')}
          options={[
            { value: '', label: '🌍 Todos los sectores' },
            ...Object.values(SECTORS).map(s => ({ value: s.id, label: s.name })),
          ]}
        />
      </div>

      {/* Botón crear */}
      <Button onClick={handleNewClient} variant="success" className="w-full md:w-auto">
        ➕ Nuevo Cliente
      </Button>

      {/* Grid de clientes */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <div
              key={client.id}
              className="group bg-gradient-to-br from-slate-700 to-slate-800 p-5 rounded-xl border-2 border-slate-600 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/20"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg group-hover:text-blue-300 transition">
                    {client.name}
                  </h3>
                  <Badge variant="info" className={sectorColor[client.sector]}>
                    {SECTORS[client.sector].name}
                  </Badge>
                </div>
                <span className="text-2xl">👤</span>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm text-slate-300 mb-4 pb-4 border-b border-slate-600">
                {client.phone && (
                  <p>
                    <span className="text-blue-400">📱</span> {client.phone}
                  </p>
                )}
                {client.email && (
                  <p>
                    <span className="text-blue-400">📧</span> {client.email}
                  </p>
                )}
                {client.address && (
                  <p>
                    <span className="text-blue-400">📍</span> {client.address}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  📅 {new Date(client.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(client)}
                  variant="secondary"
                  className="flex-1 text-sm"
                >
                  ✏️ Editar
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(client.id)}
                  variant="secondary"
                  className="flex-1 text-sm text-red-400 hover:text-red-300"
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 bg-gradient-to-br from-slate-700 to-slate-800">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-slate-300 mb-4">
            {clients.length === 0 ? 'No hay clientes registrados' : 'No se encontraron clientes'}
          </p>
          {clients.length === 0 && (
            <Button onClick={handleNewClient} variant="success">
              ➕ Crear primer cliente
            </Button>
          )}
        </Card>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showNewModal}
        title={editingClient ? `✏️ Editar Cliente - ${editingClient.name}` : '➕ Crear Cliente Nuevo'}
        onClose={() => {
          setShowNewModal(false);
          setEditingClient(null);
        }}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewModal(false);
                setEditingClient(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="success" onClick={handleSubmit}>
              {editingClient ? '✓ Actualizar' : '✓ Crear'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="👤 Nombre del Cliente"
            placeholder="Ej: Juan Pérez"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            label="🌍 Sector"
            value={formData.sector}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value as SectorType })}
            options={Object.values(SECTORS).map(s => ({ value: s.id, label: s.name }))}
          />
          <Input
            label="📱 Teléfono (Opcional)"
            placeholder="Ej: +56912345678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            type="tel"
          />
          <Input
            label="📧 Email (Opcional)"
            placeholder="Ej: juan@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            type="email"
          />
          <Input
            label="📍 Dirección (Opcional)"
            placeholder="Ej: Calle Principal 123"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
      </Modal>

      {/* Modal Confirmar eliminación */}
      <Modal
        isOpen={!!showDeleteConfirm}
        title="⚠️ Eliminar Cliente"
        onClose={() => setShowDeleteConfirm(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              className="text-red-400 hover:text-red-300"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              🗑️ Eliminar
            </Button>
          </>
        }
      >
        <p className="text-slate-300">
          ¿Estás seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
