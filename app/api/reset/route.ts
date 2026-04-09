import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    // Delete in order respecting foreign key constraints
    await prisma.delivery.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.billingRecord.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.reminder.deleteMany();
    await prisma.client.deleteMany();
    // Products are kept (soft-delete managed separately) — but user wants full reset
    await prisma.product.deleteMany();
    // Users are kept for login

    return NextResponse.json({ message: 'Todos los datos han sido eliminados correctamente.' });
  } catch (error) {
    console.error('Delete all error:', error);
    return NextResponse.json({ error: 'Error al eliminar datos' }, { status: 500 });
  }
}
