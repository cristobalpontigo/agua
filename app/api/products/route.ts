import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all active products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, unit, price } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'Código y nombre son requeridos' }, { status: 400 });
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Precio debe ser un número válido' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        code: code.trim().toLowerCase(),
        name: name.trim(),
        description: description?.trim() || null,
        unit: unit?.trim() || 'unidad',
        price,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un producto con ese código' }, { status: 409 });
    }
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
