import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pin } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    if (user.password && pin !== user.password) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error de autenticación' }, { status: 500 });
  }
}
