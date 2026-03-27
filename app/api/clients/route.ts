import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all clients
export async function GET(request: NextRequest) {
  try {
    const clients = await prisma.client.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sales: true, payments: true },
        },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contactName, sector, phone, email, address, billingDay } = body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedContactName = typeof contactName === 'string' ? contactName.trim() : '';
    const parsedBillingDay = Number.isInteger(billingDay) ? billingDay : 10;

    if (!normalizedName || !sector) {
      return NextResponse.json(
        { error: 'Name and sector are required' },
        { status: 400 }
      );
    }

    if (parsedBillingDay < 1 || parsedBillingDay > 31) {
      return NextResponse.json(
        { error: 'Billing day must be between 1 and 31' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name: normalizedName,
        contactName: normalizedContactName || null,
        sector,
        phone: phone || null,
        email: email || null,
        address: address || null,
        billingDay: parsedBillingDay,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Client name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
