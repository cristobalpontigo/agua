/**
 * FORMULARIO DE VENTA REDISEÑADO - Premium UI
 * Interfaz moderna, elegante y profesional
 */

'use client';

import { useState } from 'react';
import { Sale, SaleLineItem, ProductType, SectorType } from '@/lib/types';
import { PRODUCTS, SECTORS, SAMPLE_CLIENTS } from '@/lib/constants';
import { SaleService, IdGeneratorService } from '@/lib/services/sale.service';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Button, Card, Badge } from '@/components/ui/FormComponents';

export function PremiumSaleForm() {
  const { addSale } = useAppContext();
  const { addToast } = useToast();

  // Estado del formulario
  const [step, setStep] = useState<'client' | 'products' | 'details' | 'review'>(
    'client'
  );
  const [clientName, setClientName] = useState('');
  const [sector, setSector] = useState<SectorType>('vizcachas');
  const [items, setItems] = useState<SaleLineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('botellon_20');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const total = SaleService.calculateTotal(items);
  const summary = items.length > 0 ? SaleService.generateSummary(items) : '';

  // Agregar producto
  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      addToast('Selecciona producto y cantidad válida', 'warning');
      return;
    }

    const product = PRODUCTS[selectedProduct];
    const newItem: SaleLineItem = {
      productId: selectedProduct,
      quantity,
      price: product.price,
      subtotal: quantity * product.price,
    };

    setItems([...items, newItem]);
    setQuantity(1);
    addToast(`✓ ${product.name} agregado`, 'success');
  };

  // Eliminar producto
  const handleRemoveItem = (index: number) => {
    const removed = items[index];
    setItems(items.filter((_, i) => i !== index));
    addToast(`✕ ${PRODUCTS[removed.productId].name} eliminado`, 'info');
  };

  // Enviar venta
  const handleSubmit = async () => {
    if (!clientName || items.length === 0) {
      addToast('Completa todos los pasos', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const sale: Sale = {
        id: IdGeneratorService.sale(),
        clientId: clientName,
        sector,
        items,
        notes: notes || undefined,
        status: 'pendiente',
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addSale(sale);
      addToast(
        `✓ Venta registrada - ${clientName} - $${total.toLocaleString()}`,
        'success'
      );

      // Reset
      setStep('client');
      setClientName('');
      setSector('vizcachas');
      setItems([]);
      setNotes('');
      setDeliveryDate('');
    } catch (error) {
      addToast('Error al guardar venta', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 1: Seleccionar cliente
  const StepClient = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-blue-300 mb-3">
          👤 ¿De quién es la venta?
        </label>
        <Select
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          options={SAMPLE_CLIENTS.map(c => ({ value: c.name, label: c.name }))}
        />
      </div>

      {clientName && (
        <div className="animate-fade-in">
          <label className="block text-sm font-bold text-blue-300 mb-3">
            🌍 Sector de {clientName}
          </label>
          <Select
            value={sector}
            onChange={(e) => setSector(e.target.value as SectorType)}
            options={Object.values(SECTORS).map(s => ({ value: s.id, label: s.name }))}
          />
        </div>
      )}

      <button
        onClick={() => setShowNewClientModal(true)}
        className="w-full text-center py-2 text-blue-400 hover:text-blue-300 transition text-sm font-semibold border border-dashed border-blue-400 rounded-lg hover:border-blue-300"
      >
        ➕ O crear nuevo cliente
      </button>
    </div>
  );

  // Paso 2: Agregar productos
  const StepProducts = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">📦 Selecciona Productos</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          label="Producto"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value as ProductType)}
          options={Object.values(PRODUCTS).map(p => ({ value: p.id, label: `${p.name} - $${p.price.toLocaleString()}` }))}
        />
        <Input
          label="Cantidad"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        />
        <div className="flex items-end">
          <Button onClick={handleAddItem} variant="success" className="w-full">
            ➕ Agregar
          </Button>
        </div>
      </div>

      {/* Productos agregados */}
      {items.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-700">
          <h4 className="font-bold text-white">Productos en venta ({items.length}):</h4>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 rounded-lg flex items-center justify-between group hover:from-slate-600 hover:to-slate-700 transition"
            >
              <div>
                <p className="font-bold text-white">
                  {PRODUCTS[item.productId].name}{' '}
                  <span className="text-blue-400">×{item.quantity}</span>
                </p>
                <p className="text-slate-400 text-sm">
                  ${item.price.toLocaleString()} c/u = <span className="text-green-400 font-bold">${item.subtotal.toLocaleString()}</span>
                </p>
              </div>
              <button
                onClick={() => handleRemoveItem(idx)}
                className="text-red-400 hover:text-red-300 hover:scale-110 transition text-2xl opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Paso 3: Detalles
  const StepDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">📅 Detalles de la Entrega</h3>

      <Input
        label="📅 Fecha de Entrega"
        type="date"
        value={deliveryDate}
        onChange={(e) => setDeliveryDate(e.target.value)}
      />

      <Input
        label="📝 Notas Especiales"
        placeholder="Ej: Dejar en la puerta, cliente fuera de zona, etc..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  );

  // Paso 4: Revisión
  const StepReview = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">✓ Revisar Venta</h3>

      <Card className="space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
          <span className="text-slate-300">👤 Cliente:</span>
          <span className="font-bold text-white">{clientName}</span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
          <span className="text-slate-300">🌍 Sector:</span>
          <span className="font-bold text-white">{SECTORS[sector].name}</span>
        </div>

        <div className="flex justify-between items-start pb-3 border-b border-slate-700">
          <span className="text-slate-300">📦 Productos:</span>
          <div className="text-right">
            {items.map((item, i) => (
              <p key={i} className="text-white">
                {PRODUCTS[item.productId].name} ×{item.quantity}
              </p>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
          <span className="text-slate-300">📅 Entrega:</span>
          <span className="font-bold text-white">
            {deliveryDate ? new Date(deliveryDate).toLocaleDateString('es-CL') : 'No especificada'}
          </span>
        </div>

        {notes && (
          <div className="flex justify-between items-start pb-3 border-b border-slate-700">
            <span className="text-slate-300">📝 Notas:</span>
            <span className="text-white text-right">{notes}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 bg-gradient-to-r from-green-900 to-green-800 p-3 rounded-lg">
          <span className="text-lg font-bold text-green-100">💰 Total:</span>
          <span className="text-3xl font-black text-green-300">${total.toLocaleString()}</span>
        </div>
      </Card>
    </div>
  );

  const steps: Array<{ id: typeof step; label: string; icon: string }> = [
    { id: 'client', label: 'Cliente', icon: '👤' },
    { id: 'products', label: 'Productos', icon: '📦' },
    { id: 'details', label: 'Detalles', icon: '📅' },
    { id: 'review', label: 'Revisar', icon: '✓' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => setStep(s.id)}
              className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition transform ${
                idx <= currentStepIndex
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg hover:scale-105'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {s.icon}
            </button>
            <div className="ml-2 hidden md:block">
              <p className="font-semibold text-white text-sm">{s.label}</p>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition ${
                  idx < currentStepIndex
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                    : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso */}
      <Card>
        <div className="animate-fade-in">
          {step === 'client' && <StepClient />}
          {step === 'products' && <StepProducts />}
          {step === 'details' && <StepDetails />}
          {step === 'review' && <StepReview />}
        </div>
      </Card>

      {/* Botones de navegación */}
      <div className="flex gap-3 justify-between">
        <Button
          onClick={() => {
            const idx = steps.findIndex(s => s.id === step);
            if (idx > 0) setStep(steps[idx - 1].id);
          }}
          variant="secondary"
          disabled={currentStepIndex === 0}
          className="flex-1"
        >
          ← Anterior
        </Button>

        {step !== 'review' && clientName && items.length > 0 && (
          <Button
            onClick={() => {
              const idx = steps.findIndex(s => s.id === step);
              if (idx < steps.length - 1) setStep(steps[idx + 1].id);
            }}
            variant="primary"
            className="flex-1"
          >
            Siguiente →
          </Button>
        )}

        {step === 'review' && (
          <Button
            onClick={handleSubmit}
            variant="success"
            isLoading={isSubmitting}
            className="flex-1"
          >
            ✓ Confirmar y Guardar
          </Button>
        )}
      </div>

      {/* Modal para crear cliente */}
      <Modal
        isOpen={showNewClientModal}
        title="➕ Crear Cliente Rápido"
        onClose={() => setShowNewClientModal(false)}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewClientModal(false)}>
              Cancelar
            </Button>
            <Button variant="success">✓ Crear</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Nombre del cliente" />
          <Select
            label="Sector"
            options={Object.values(SECTORS).map(s => ({ value: s.id, label: s.name }))}
          />
          <Input label="Teléfono (opcional)" placeholder="Teléfono" type="tel" />
        </div>
      </Modal>
    </div>
  );
}
