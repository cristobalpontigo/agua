import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '', 10);
    const month = parseInt(searchParams.get('month') || '', 10);

    const where = {
      ...(Number.isInteger(year) ? { year } : {}),
      ...(Number.isInteger(month) ? { month } : {}),
    };

    const records = await prisma.billingRecord.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching billing records:', error);
    return NextResponse.json({ error: 'Failed to fetch billing records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, year, month, invoiceNumber } = body;
    const normalizedInvoiceNumber = typeof invoiceNumber === 'string' ? invoiceNumber.trim() : '';

    if (!clientId || !Number.isInteger(year) || !Number.isInteger(month)) {
      return NextResponse.json({ error: 'clientId, year and month are required' }, { status: 400 });
    }

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'month must be between 1 and 12' }, { status: 400 });
    }

    const record = await prisma.billingRecord.upsert({
      where: {
        clientId_year_month: {
          clientId,
          year,
          month,
        },
      },
      update: {
        invoiceNumber: normalizedInvoiceNumber || null,
      },
      create: {
        clientId,
        year,
        month,
        invoiceNumber: normalizedInvoiceNumber || null,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error saving billing record:', error);
    return NextResponse.json({ error: 'Failed to save billing record' }, { status: 500 });
  }
}