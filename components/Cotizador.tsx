'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ApiProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  unit: string;
}

interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteData {
  clientName: string;
  clientRut: string;
  clientAddress: string;
  clientPhone: string;
  notes: string;
  validDays: number;
  items: QuoteItem[];
}

const EMPTY_QUOTE: QuoteData = {
  clientName: '',
  clientRut: '',
  clientAddress: '',
  clientPhone: '',
  notes: '',
  validDays: 15,
  items: [],
};

export function Cotizador() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [quote, setQuote] = useState<QuoteData>({ ...EMPTY_QUOTE });
  const [quoteNumber, setQuoteNumber] = useState(1);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiProduct[]) => setProducts(data))
      .catch(() => {});

    // Load quote counter
    try {
      const stored = localStorage.getItem('agua.quoteCounter');
      if (stored) setQuoteNumber(parseInt(stored) || 1);
    } catch {}
  }, []);

  const addItem = () => {
    const first = products[0];
    if (!first) return;
    setQuote(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: first.code,
        productName: first.name,
        quantity: 1,
        unitPrice: first.price,
      }],
    }));
  };

  const updateItem = (idx: number, field: keyof QuoteItem, value: any) => {
    setQuote(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === 'productId') {
        const p = products.find(pr => pr.code === value);
        if (p) {
          items[idx].productName = p.name;
          items[idx].unitPrice = p.price;
        }
      }
      return { ...prev, items };
    });
  };

  const removeItem = (idx: number) => {
    setQuote(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const resetQuote = () => {
    const next = quoteNumber + 1;
    setQuoteNumber(next);
    localStorage.setItem('agua.quoteCounter', String(next));
    setQuote({ ...EMPTY_QUOTE });
    setSaved(false);
  };

  const printQuote = () => {
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + quote.validDays);

    const formatDate = (d: Date) => d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fmtCLP = (n: number) => '$' + n.toLocaleString('es-CL');

    const itemsRows = quote.items.map((item, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${item.productName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmtCLP(item.unitPrice)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${fmtCLP(item.quantity * item.unitPrice)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización N° ${String(quoteNumber).padStart(4, '0')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #0e7490; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 700; color: #0e7490; letter-spacing: -0.5px; }
    .logo-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .quote-info { text-align: right; }
    .quote-number { font-size: 20px; font-weight: 700; color: #0e7490; }
    .quote-date { font-size: 12px; color: #64748b; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px; }
    .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .client-field { font-size: 13px; }
    .client-label { font-weight: 600; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #0e7490; color: white; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; text-align: left; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; text-align: right; }
    th:nth-child(3), th:nth-child(4) { text-align: center; }
    td { font-size: 13px; }
    .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
    .totals-box { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals-row.total { border-top: 2px solid #0e7490; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #0e7490; }
    .notes { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .validity { margin-top: 16px; padding: 10px 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; color: #92400e; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">AGUAS</div>
      <div class="logo-sub">Gestión de ventas de agua</div>
    </div>
    <div class="quote-info">
      <div class="quote-number">Cotización N° ${String(quoteNumber).padStart(4, '0')}</div>
      <div class="quote-date">Fecha: ${formatDate(today)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos del cliente</div>
    <div class="client-grid">
      <div class="client-field"><span class="client-label">Nombre:</span> ${quote.clientName || '—'}</div>
      <div class="client-field"><span class="client-label">RUT:</span> ${quote.clientRut || '—'}</div>
      <div class="client-field"><span class="client-label">Dirección:</span> ${quote.clientAddress || '—'}</div>
      <div class="client-field"><span class="client-label">Teléfono:</span> ${quote.clientPhone || '—'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detalle de productos</div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center">#</th>
          <th>Producto</th>
          <th style="width:80px;text-align:center">Cant.</th>
          <th style="width:110px;text-align:right">P. Unit.</th>
          <th style="width:110px;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8">Sin productos</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Neto</span><span>${fmtCLP(subtotal)}</span></div>
      <div class="totals-row"><span>IVA (19%)</span><span>${fmtCLP(iva)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${fmtCLP(total)}</span></div>
    </div>
  </div>

  <div class="validity">
    Esta cotización es válida por ${quote.validDays} días — hasta el ${formatDate(validUntil)}.
  </div>

  ${quote.notes ? `<div class="section" style="margin-top:20px"><div class="section-title">Observaciones</div><div class="notes">${quote.notes}</div></div>` : ''}

  <div class="footer">
    AGUAS · Cotización generada el ${formatDate(today)} · Documento no tributario
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);

    // Save counter
    const next = quoteNumber + 1;
    setQuoteNumber(next);
    localStorage.setItem('agua.quoteCounter', String(next));
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Cotizador</h3>
          <p className="text-xs text-slate-500">Cotización N° {String(quoteNumber).padStart(4, '0')}</p>
        </div>
        <button
          onClick={resetQuote}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 active:bg-slate-50"
        >
          Nueva cotización
        </button>
      </div>

      {/* Client data */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Datos del cliente</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={quote.clientName}
            onChange={e => setQuote({ ...quote, clientName: e.target.value })}
            placeholder="Nombre / Razón social"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="text"
            value={quote.clientRut}
            onChange={e => setQuote({ ...quote, clientRut: e.target.value })}
            placeholder="RUT"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="text"
            value={quote.clientAddress}
            onChange={e => setQuote({ ...quote, clientAddress: e.target.value })}
            placeholder="Dirección"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="tel"
            value={quote.clientPhone}
            onChange={e => setQuote({ ...quote, clientPhone: e.target.value })}
            placeholder="Teléfono"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Productos</p>
          <button
            onClick={addItem}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-emerald-700"
          >
            + Agregar
          </button>
        </div>

        {quote.items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400">
            Agrega productos a la cotización
          </div>
        )}

        {quote.items.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-2">
            <div className="flex gap-2 items-center">
              <select
                value={item.productId}
                onChange={e => updateItem(idx, 'productId', e.target.value)}
                className="flex-1 px-2 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900"
              >
                {products.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => removeItem(idx)}
                className="px-2.5 py-2.5 bg-red-600 active:bg-red-700 text-white rounded-lg text-sm shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-lg text-slate-700 font-bold text-lg active:bg-slate-300"
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-14 px-1 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-center text-slate-900"
                />
                <button
                  onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-lg text-slate-700 font-bold text-lg active:bg-slate-300"
                >+</button>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-right text-slate-900"
                />
                <span className="text-base font-bold text-emerald-700 whitespace-nowrap">{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Validity and notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Validez (días)</label>
          <input
            type="number"
            min="1"
            value={quote.validDays}
            onChange={e => setQuote({ ...quote, validDays: parseInt(e.target.value) || 15 })}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones</label>
          <input
            type="text"
            value={quote.notes}
            onChange={e => setQuote({ ...quote, notes: e.target.value })}
            placeholder="Notas adicionales..."
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Totals */}
      {quote.items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Neto ({quote.items.length} productos)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>IVA (19%)</span>
              <span>{formatCurrency(iva)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-cyan-800 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={printQuote}
        disabled={quote.items.length === 0}
        className="w-full rounded-xl bg-cyan-700 py-4 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        📄 Generar e imprimir cotización
      </button>

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 text-center">
          ✓ Cotización generada. Se abrió en una pestaña nueva para imprimir/guardar como PDF.
        </div>
      )}
    </div>
  );
}
