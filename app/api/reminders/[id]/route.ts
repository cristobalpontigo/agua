import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT update a reminder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, dueDate, priority, completed, notified } = body;

    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Recordatorio no encontrado' }, { status: 404 });
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(priority !== undefined && { priority }),
        ...(completed !== undefined && { completed }),
        ...(notified !== undefined && { notified }),
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

// DELETE a reminder
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
