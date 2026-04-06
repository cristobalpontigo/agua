import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all sales or specific sale by client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const sales = await prisma.sale.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(status && { status }),
      },
      include: {
        client: true,
        saleItems: true,
        payments: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

// POST new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, userId, saleItems, items, total, notes } = body;
    const normalizedItems = Array.isArray(saleItems)
      ? saleItems
      : Array.isArray(items)
        ? items
        : [];
    const computedTotal =
      typeof total === 'number'
        ? total
        : normalizedItems.reduce((sum: number, item: any) => sum + (item?.subtotal || 0), 0);

    if (!clientId || normalizedItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let resolvedUserId: string = userId;
    if (!resolvedUserId) {
      const fallbackUser = await prisma.user.upsert({
        where: { email: 'jramirez@aguas.local' },
        update: { active: true },
        create: {
          email: 'jramirez@aguas.local',
          password: '1234',
          name: 'Juan Carlos Ramirez',
          role: 'admin',
          active: true,
        },
      });
      resolvedUserId = fallbackUser.id;
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        clientId,
        userId: resolvedUserId,
        total: computedTotal,
        notes: notes || null,
        status: 'pending',
        saleItems: {
          create: normalizedItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        client: true,
        saleItems: true,
        payments: true,
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
