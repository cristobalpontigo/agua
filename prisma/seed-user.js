const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Update old email if exists
  try {
    await p.user.update({
      where: { email: 'jcramirez@aguas.local' },
      data: { email: 'jramirez@aguas.local' },
    });
  } catch { /* already updated or not found */ }

  const u = await p.user.upsert({
    where: { email: 'jramirez@aguas.local' },
    update: { name: 'Juan Carlos Ramirez', active: true, password: '1234' },
    create: {
      email: 'jramirez@aguas.local',
      password: '1234',
      name: 'Juan Carlos Ramirez',
      role: 'admin',
      active: true,
    },
  });
  console.log('USER:', JSON.stringify(u));
  const all = await p.user.findMany();
  console.log('ALL_USERS:', JSON.stringify(all));
  await p.$disconnect();
}

main();
