'use client';

import { Sale } from '@/lib/types';
import { generateSalesCSV, createBlob } from '@/lib/db/exports';

interface ExportButtonsProps {
  sales: Sale[];
}

export function ExportButtons({ sales }: ExportButtonsProps) {
  const handleExportCSV = () => {
    const csv = generateSalesCSV(sales);
    const blob = createBlob(csv, 'text/csv');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(sales, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        📊 Exportar CSV
      </button>
      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        📁 Exportar JSON
      </button>
    </div>
  );
}
