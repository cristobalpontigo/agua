'use client';

import { useState } from 'react';
import { Sale, SaleLineItem, ProductType, SectorType, Payment } from '@/lib/types';
import { PRODUCTS, SECTORS, SAMPLE_CLIENTS } from '@/lib/constants';
import { calculateSaleTotal, generateSaleSummary, generateId, formatCurrency } from '@/lib/utils';
import { PaymentManager } from '@/components/PaymentManager';

interface SaleFormProps {
  onSaleSubmit: (sale: Sale) => void;
}

export function SaleForm({ onSaleSubmit }: SaleFormProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<SectorType>('vizcachas');
  const [items, setItems] = useState<SaleLineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('botellon_20');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  const total = calculateSaleTotal(items);

  const handleAddItem = () => {
    if (quantity <= 0) return;

    const product = PRODUCTS[selectedProduct];
    const newItem: SaleLineItem = {
      productId: selectedProduct,
      quantity,
      price: product.price,
      subtotal: quantity * product.price,
    };

    setItems([...items, newItem]);
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddPayment = (payment: Payment) => {
    setPayments([...payments, payment]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient || items.length === 0) {
      alert('Por favor selecciona un cliente y agrega al menos un producto');
      return;
    }

    const sale: Sale = {
      id: generateId(),
      clientId: selectedClient,
      sector: selectedSector,
      items,
      notes,
      status: 'pendiente',
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSaleSubmit(sale);

    // Reset form
    setSelectedClient('');
    setSelectedSector('vizcachas');
    setItems([]);
    setSelectedProduct('botellon_20');
    setQuantity(1);
    setNotes('');
    setDeliveryDate('');
    setPayments([]);
    setShowPaymentSection(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">📝 Nueva Venta</h2>
          <p className="text-slate-400">Registra una venta completa con cliente, productos y pagos</p>
        </div>

        {/* Client and Sector Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-700 bg-opacity-40 p-6 rounded-xl border border-slate-600">
          <div>
            <label className="block text-sm font-semibold text-blue-300 mb-3">👤 Cliente</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium bg-white hover:border-slate-500 transition"
            >
              <option value="">-- Selecciona un cliente --</option>
              {SAMPLE_CLIENTS.map((client) => (
                <option key={client.name} value={client.name}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-300 mb-3">🌍 Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as SectorType)}
              className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium bg-white hover:border-slate-500 transition"
            >
              {Object.values(SECTORS).map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Items Section */}
        <div className="bg-slate-700 bg-opacity-40 p-6 rounded-xl border border-slate-600">
          <h3 className="text-xl font-bold text-white mb-6">📦 Agregar Productos</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2">Producto</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value as ProductType)}
                className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800 font-medium bg-white focus:ring-2 focus:ring-blue-500 transition"
              >
                {Object.values(PRODUCTS).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2">Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-white bg-slate-700 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2">Precio Unit.</label>
              <input
                type="text"
                disabled
                value={formatCurrency(PRODUCTS[selectedProduct].price)}
                className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg bg-slate-800 text-blue-300 font-semibold cursor-not-allowed"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-3 rounded-lg font-bold transition transform hover:scale-105 active:scale-95 shadow-lg"
              >
                ✓ Agregar
              </button>
            </div>
          </div>

          {/* Items Display */}
          {items.length > 0 && (
            <div className="bg-slate-800 bg-opacity-50 rounded-lg p-4 space-y-3">
              <p className="text-slate-300 font-semibold mb-3">Artículos agregados ({items.length}):</p>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-700 p-4 rounded-lg hover:border-l-4 hover:border-green-500 transition">
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {PRODUCTS[item.productId].name} <span className="text-blue-400">×{item.quantity}</span>
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      {formatCurrency(item.price)} c/u = <span className="text-green-400 font-bold">{formatCurrency(item.subtotal)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-400 hover:text-red-300 font-bold ml-4 text-lg hover:scale-110 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-700 bg-opacity-40 p-6 rounded-xl border border-slate-600">
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-3">📅 Fecha de Entrega</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium bg-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-3">📝 Notas</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales o especiales..."
                className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500 bg-white transition"
              />
            </div>
          </div>
        )}

        {/* Total Summary */}
        {items.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-xl border-2 border-blue-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold text-blue-100">Total de la Venta:</span>
              <span className="text-4xl font-bold text-green-400">{formatCurrency(total)}</span>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              {generateSaleSummary(items)}
            </p>

            <button
              type="button"
              onClick={() => setShowPaymentSection(!showPaymentSection)}
              className="w-full px-4 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              💳 {showPaymentSection ? 'Ocultar' : 'Procesar Pago'}
            </button>
          </div>
        )}

        {/* Payment Section */}
        {items.length > 0 && showPaymentSection && (
          <PaymentManager
            saleTotal={total}
            saleId={generateId()}
            payments={payments}
            onAddPayment={handleAddPayment}
          />
        )}

        {/* Submit Button */}
        {items.length > 0 && (
          <button
            type="submit"
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-lg rounded-xl transition transform hover:scale-105 active:scale-95 shadow-2xl"
          >
            ✓ Registrar Venta Completa
          </button>
        )}
      </form>
    </div>
  );
}
