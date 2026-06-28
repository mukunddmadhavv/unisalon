import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst({
    where: {
      name: { contains: "Beauty", mode: "insensitive" }
    }
  });

  if (!shop) return;
  
  const services = await prisma.service.findMany({
    where: { shopId: shop.id }
  });
  
  console.log(services.map(s => ({ name: s.name, imageUrl: s.imageUrl })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
