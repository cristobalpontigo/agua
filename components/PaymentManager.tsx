'use client';

import { useState } from 'react';
import { Payment, PaymentMethod } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface PaymentManagerProps {
  saleTotal: number;
  saleId: string;
  payments: Payment[];
  onAddPayment: (payment: Payment) => void;
}

export function PaymentManager({ saleTotal, saleId, payments, onAddPayment }: PaymentManagerProps) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = Math.max(0, saleTotal - paidAmount);
  const paymentPercentage = (paidAmount / saleTotal) * 100;

  const handleAddPayment = () => {
    if (amount <= 0 || amount > pendingAmount) {
      alert(`Por favor ingresa un monto válido (0 - ${formatCurrency(pendingAmount)})`);
      return;
    }

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      saleId,
      clientId: 'temp',
      amount,
      method,
      status: 'completado',
      date: new Date(),
      notes: notes || undefined,
    };

    onAddPayment(newPayment);
    setAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-lg border border-slate-700">
      {/* Payment Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-white">Estado de Pago</span>
          <span className="text-2xl font-bold text-blue-400">{Math.round(paymentPercentage)}%</span>
        </div>

        <div className="w-full bg-slate-700 rounded-full h-3 border border-slate-600">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              paymentPercentage === 100 ? 'bg-green-500' : paymentPercentage > 50 ? 'bg-blue-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
            <p className="text-slate-400 text-sm">Total</p>
            <p className="text-white font-bold text-lg">{formatCurrency(saleTotal)}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
            <p className="text-slate-400 text-sm">Pagado</p>
            <p className="text-green-400 font-bold text-lg">{formatCurrency(paidAmount)}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
            <p className="text-slate-400 text-sm">Pendiente</p>
            <p className={`font-bold text-lg ${pendingAmount === 0 ? 'text-green-400' : 'text-orange-400'}`}>
              {formatCurrency(pendingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment Form */}
      {pendingAmount > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white">Registrar Pago</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Monto</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder={`Máx: ${formatCurrency(pendingAmount)}`}
                max={pendingAmount}
                min={0}
                step={100}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Método de Pago</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="cheque">📄 Cheque</option>
                <option value="tarjeta">💳 Tarjeta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referencia o detalles del pago..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleAddPayment}
            disabled={amount <= 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-lg transition transform hover:scale-105 active:scale-95"
          >
            ✓ Confirmar Pago {amount > 0 && `(${formatCurrency(amount)})`}
          </button>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="pt-6 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Historial de Pagos</h3>

          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-lg border border-slate-600 flex justify-between items-center hover:border-blue-500 transition">
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {payment.method === 'efectivo' && '💵'}
                    {payment.method === 'transferencia' && '🏦'}
                    {payment.method === 'cheque' && '📄'}
                    {payment.method === 'tarjeta' && '💳'}
                    {' '}{payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                  </p>
                  {payment.notes && <p className="text-slate-400 text-sm mt-1">{payment.notes}</p>}
                  <p className="text-slate-500 text-xs mt-1">{new Date(payment.date).toLocaleDateString('es-CL')}</p>
                </div>
                <p className="text-green-400 font-bold text-xl ml-4">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {pendingAmount === 0 && payments.length > 0 && (
        <div className="bg-green-900 border-2 border-green-500 p-4 rounded-lg">
          <p className="text-green-200 font-semibold">✓ Venta completamente pagada</p>
        </div>
      )}
    </div>
  );
}
