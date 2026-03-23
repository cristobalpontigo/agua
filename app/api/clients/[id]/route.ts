import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        _count: {
          select: { sales: true, payments: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sector, phone, email, address, active } = body;

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sector && { sector }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Error updating client:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE client (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Error deleting client:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
