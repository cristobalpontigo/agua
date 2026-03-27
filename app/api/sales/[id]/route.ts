import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET sale by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        client: true,
        saleItems: true,
        payments: true,
        delivery: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
  }
}

// PUT update sale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, completedAt, delivery } = body;

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
      },
      include: {
        client: true,
        saleItems: true,
        payments: true,
        delivery: true,
      },
    });

    let updatedSale = sale;
    if (delivery) {
      const normalizedDeliveryStatus = delivery.status || 'scheduled';
      const normalizedCompletedAt =
        delivery.completedAt || normalizedDeliveryStatus === 'delivered'
          ? new Date(delivery.completedAt || new Date())
          : null;

      await prisma.delivery.upsert({
        where: { saleId: id },
        update: {
          ...(delivery.scheduledDate && { scheduledDate: new Date(delivery.scheduledDate) }),
          ...(delivery.notes !== undefined && { notes: delivery.notes || null }),
          ...(normalizedDeliveryStatus && { status: normalizedDeliveryStatus }),
          ...(normalizedCompletedAt && { completedAt: normalizedCompletedAt }),
        },
        create: {
          saleId: id,
          clientId: existingSale.clientId,
          scheduledDate: delivery.scheduledDate ? new Date(delivery.scheduledDate) : new Date(),
          status: normalizedDeliveryStatus,
          completedAt: normalizedCompletedAt,
          notes: delivery.notes || null,
        },
      });

      if (normalizedDeliveryStatus === 'delivered') {
        await prisma.sale.update({
          where: { id },
          data: {
            status: 'completed',
            completedAt: normalizedCompletedAt || new Date(),
          },
        });
      }

      updatedSale = await prisma.sale.findUnique({
        where: { id },
        include: {
          client: true,
          saleItems: true,
          payments: true,
          delivery: true,
        },
      }) as typeof sale;
    }

    return NextResponse.json(updatedSale);
  } catch (error: any) {
    console.error('Error updating sale:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

// DELETE sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Cascade delete through Prisma (SaleItems are already set to cascade)
    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
