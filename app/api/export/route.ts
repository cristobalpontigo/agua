import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all data
    const [clients, sales, saleItems, payments, deliveries, billingRecords, products, reminders] =
      await Promise.all([
        prisma.client.findMany({ orderBy: { name: 'asc' } }),
        prisma.sale.findMany({ orderBy: { createdAt: 'desc' }, include: { client: true } }),
        prisma.saleItem.findMany(),
        prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, include: { client: true } }),
        prisma.delivery.findMany({ orderBy: { createdAt: 'desc' }, include: { client: true } }),
        prisma.billingRecord.findMany({ include: { client: true } }),
        prisma.product.findMany({ orderBy: { name: 'asc' } }),
        prisma.reminder.findMany({ orderBy: { dueDate: 'desc' } }),
      ]);

    // Build CSV sheets separated by headers
    const lines: string[] = [];

    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    // --- CLIENTES ---
    lines.push('=== CLIENTES ===');
    lines.push('ID,Nombre,Contacto,Sector,Teléfono,Email,Dirección,Día Facturación,Activo,Creado');
    for (const c of clients) {
      lines.push(
        [c.id, c.name, c.contactName, c.sector, c.phone, c.email, c.address, c.billingDay, c.active, c.createdAt.toISOString()]
          .map(esc).join(',')
      );
    }

    lines.push('');

    // --- PRODUCTOS ---
    lines.push('=== PRODUCTOS ===');
    lines.push('ID,Código,Nombre,Descripción,Unidad,Precio,Activo,Creado');
    for (const p of products) {
      lines.push(
        [p.id, p.code, p.name, p.description, p.unit, p.price, p.active, p.createdAt.toISOString()]
          .map(esc).join(',')
      );
    }

    lines.push('');

    // --- VENTAS ---
    lines.push('=== VENTAS ===');
    lines.push('ID,Cliente,ClienteNombre,Total,Estado,Notas,Creada,Completada');
    for (const s of sales) {
      lines.push(
        [s.id, s.clientId, (s as any).client?.name, s.total, s.status, s.notes, s.createdAt.toISOString(), s.completedAt?.toISOString()]
          .map(esc).join(',')
      );
    }

    lines.push('');

    // --- ITEMS DE VENTA ---
    lines.push('=== ITEMS DE VENTA ===');
    lines.push('ID,VentaID,ProductoID,Cantidad,Precio,Subtotal');
    for (const si of saleItems) {
      lines.push(
        [si.id, si.saleId, si.productId, si.quantity, si.price, si.subtotal]
          .map(esc).join(',')
      );
    }

    lines.push('');

    // --- PAGOS ---
    lines.push('=== PAGOS ===');
    lines.push('ID,ClienteID,ClienteNombre,VentaID,Monto,Método,Estado,Nota,Creado');
    for (const p of payments) {
      lines.push(
        [p.id, p.clientId, (p as any).client?.name, p.saleId, p.amount, p.method, p.status, p.note, p.createdAt.toISOString()]
          .map(esc).join(',')
      );
    }

    lines.push('');

    // --- ENTREGAS ---
    lines.push('=== ENTREGAS ===');
    lines.push('ID,VentaID,ClienteID,ClienteNombre,Programada,Completada,Estado,Notas');
    for (const d of deliveries) {
      lines.push(
        [d.id, d.saleId, d.clientId, (d as any).client?.name, d.scheduledDate.toISOString(), d.completedAt?.toISOString(), d.status, d.notes]
          .map(esc).join(',')
      );
    }

    lines.push('');

    // --- FACTURACIÓN ---
    lines.push('=== FACTURACIÓN ===');
    lines.push('ID,ClienteID,ClienteNombre,Año,Mes,NúmeroFactura');
    for (const b of billingRecords) {
      lines.push(
        [b.id, b.clientId, (b as any).client?.name, b.year, b.month, b.invoiceNumber]
          .map(esc).join(',')
      );
    }

    lines.push('');

    // --- RECORDATORIOS ---
    lines.push('=== RECORDATORIOS ===');
    lines.push('ID,Título,Descripción,FechaVencimiento,Completado,Prioridad,Creado');
    for (const r of reminders) {
      lines.push(
        [r.id, r.title, r.description, r.dueDate.toISOString(), r.completed, r.priority, r.createdAt.toISOString()]
          .map(esc).join(',')
      );
    }

    const csv = '\uFEFF' + lines.join('\r\n'); // BOM for Excel UTF-8

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="agua_backup_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 });
  }
}
