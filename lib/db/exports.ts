import { Sale } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PRODUCTS, SECTORS } from '@/lib/constants';
import { SaleService } from '@/lib/services/sale.service';

/**
 * Generate CSV content from sales
 */
export function generateSalesCSV(sales: Sale[]): string {
  const headers = ['ID', 'Cliente', 'Sector', 'Productos', 'Total', 'Estado', 'Fecha'];
  
  const rows = sales.map(sale => [
    sale.id,
    sale.clientId,
    SECTORS[sale.sector]?.name || sale.sector,
    sale.items
      .map(item => `${PRODUCTS[item.productId]?.name} x${item.quantity}`)
      .join('; '),
    SaleService.calculateTotal(sale.items).toString(),
    sale.status,
    formatDate(sale.createdAt),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Generate CSV content from reports
 */
export function generateReportCSV(data: any[], headers: string[]): string {
  const headerRow = headers.join(',');
  const dataRows = data.map((row: any) => 
    headers.map(header => {
      const value = row[header];
      return `"${value}"`;
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Create downloadable blob
 */
export function createBlob(content: string, mimeType: string = 'text/csv;charset=utf-8;'): Blob {
  const BOM = '\uFEFF';
  return new Blob([BOM + content], { type: mimeType });
}

/**
 * Generate PDF content
 */
export function generateSalesPDF(sales: Sale[]): string {
  let pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 1000 >>
stream
BT
/F1 20 Tf
50 750 Td
(Reporte de Ventas - AGUAS) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000203 00000 n 
0000000281 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1331
%%EOF`;
  
  return pdf;
}
