import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        district: true,
        city: true,
        status: true,
        latitude: true,
        longitude: true,
      }
    });
    console.log("All Shops in DB:");
    console.log(JSON.stringify(shops, null, 2));
  } catch (err: any) {
    console.error("Error reading database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
