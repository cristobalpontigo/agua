const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = [
    { code: 'botellon_20', name: 'Botellón 20L', unit: 'botellón', price: 3500 },
    { code: 'bidon_10', name: 'Bidón 10L', unit: 'bidón', price: 2000 },
    { code: 'bidon_6', name: 'Bidón 6L', unit: 'bidón', price: 1500 },
    { code: 'agua_soda_2', name: 'Agua/Soda 2L', unit: 'botella', price: 800 },
    { code: 'hielo_kilo', name: 'Hielo Kg', unit: 'kilo', price: 500 },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { code: prod.code },
      update: { name: prod.name, unit: prod.unit, price: prod.price },
      create: prod,
    });
    console.log('OK:', prod.code);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
