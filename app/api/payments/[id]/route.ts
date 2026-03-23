import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET payment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        client: true,
        sale: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}

// PUT update payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, method, status, note, processedAt } = body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(method && { method }),
        ...(status && { status }),
        ...(note !== undefined && { note }),
        ...(processedAt && { processedAt: new Date(processedAt) }),
      },
      include: {
        client: true,
        sale: true,
      },
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('Error updating payment:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

// DELETE payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
