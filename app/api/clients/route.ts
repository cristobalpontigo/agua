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
    const { name, sector, phone, email, address } = body;

    if (!name || !sector) {
      return NextResponse.json(
        { error: 'Name and sector are required' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        sector,
        phone: phone || null,
        email: email || null,
        address: address || null,
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
