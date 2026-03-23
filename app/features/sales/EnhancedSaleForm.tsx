/**
 * NUEVA FORMA DE VENTA - Usando arquitectura moderna
 * Integrado con Context API, validaciones, y componentes reutilizables
 */

'use client';

import { useState } from 'react';
import { Sale, SaleLineItem, ProductType, SectorType } from '@/lib/types';
import { PRODUCTS, SECTORS, SAMPLE_CLIENTS } from '@/lib/constants';
import { SaleService, IdGeneratorService } from '@/lib/services/sale.service';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { Input, Select, Button, Card } from '@/components/ui/FormComponents';

export function EnhancedSaleForm() {
  const { addSale, addPayment } = useAppContext();
  const { addToast } = useToast();

  // Estado del formulario
  const [clientName, setClientName] = useState('');
  const [sector, setSector] = useState<SectorType>('vizcachas');
  const [items, setItems] = useState<SaleLineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('botellon_20');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cálculos
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
    addToast(`${product.name} agregado`, 'success');
  };

  // Eliminar producto
  const handleRemoveItem = (index: number) => {
    const removed = items[index];
    setItems(items.filter((_, i) => i !== index));
    addToast(`${PRODUCTS[removed.productId].name} eliminado`, 'info');
  };

  // Enviar venta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName) {
      addToast('Selecciona un cliente', 'error');
      return;
    }

    if (items.length === 0) {
      addToast('Agrega al menos un producto', 'error');
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
      addToast(`✓ Venta registrada ${clientName} - ${PRODUCTS[items[0].productId].name}`, 'success');

      // Limpiar formulario
      setClientName('');
      setSector('vizcachas');
      setItems([]);
      setNotes('');
      setDeliveryDate('');
    } catch (error) {
      addToast('Error al guardar venta', 'error');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">📝 Nueva Venta</h2>
          <p className="text-slate-400">Registra una venta rápidamente</p>
        </div>

        {/* Cliente y Sector */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="👤 Cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              options={SAMPLE_CLIENTS.map(c => ({ value: c.name, label: c.name }))}
            />
            <Select
              label="🌍 Sector"
              value={sector}
              onChange={(e) => setSector(e.target.value as SectorType)}
              options={Object.values(SECTORS).map(s => ({ value: s.id, label: s.name }))}
            />
          </div>
        </Card>

        {/* Productos */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">📦 Productos</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select
                label="Producto"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value as ProductType)}
                options={Object.values(PRODUCTS).map(p => ({ value: p.id, label: p.name }))}
              />
              <Input
                label="Cantidad"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <Input
                label="Precio Unit."
                type="text"
                disabled
                value={`$${PRODUCTS[selectedProduct].price.toLocaleString()}`}
              />
              <div className="flex items-end">
                <Button onClick={handleAddItem} variant="success" className="w-full">
                  ✓ Agregar
                </Button>
              </div>
            </div>

            {/* Items agregados */}
            {items.length > 0 && (
              <div className="space-y-2 bg-slate-800 bg-opacity-50 p-4 rounded-lg">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                    <div>
                      <p className="font-bold text-white">
                        {PRODUCTS[item.productId].name} <span className="text-blue-400">×{item.quantity}</span>
                      </p>
                      <p className="text-slate-400 text-sm">${(item.subtotal).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-400 hover:scale-110 transition text-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Detalles adicionales */}
        {items.length > 0 && (
          <>
            <Card>
              <h3 className="text-lg font-bold text-white mb-4">📅 Detalles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha de Entrega"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
                <Input
                  label="Notas"
                  placeholder="Notas adicionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </Card>

            {/* Resumen */}
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-sm">Resumen</p>
                  <p className="text-slate-300">{summary}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total</p>
                  <p className="text-4xl font-bold text-green-400">${total.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full"
            >
              ✓ Registrar Venta
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
