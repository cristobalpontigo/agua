import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all reminders for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const showCompleted = searchParams.get('completed') === 'true';

    const reminders = await prisma.reminder.findMany({
      where: {
        ...(userId && { userId }),
        ...(!showCompleted && { completed: false }),
      },
      orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST create a new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, dueDate, priority } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Título y fecha son requeridos' },
        { status: 400 }
      );
    }

    // Resolve userId — default to jramirez
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const user = await prisma.user.findUnique({ where: { email: 'jramirez@aguas.local' } });
      if (user) resolvedUserId = user.id;
      else {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 });
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: resolvedUserId,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: new Date(dueDate),
        priority: priority || 'normal',
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}
