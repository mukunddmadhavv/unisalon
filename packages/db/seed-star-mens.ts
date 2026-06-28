import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const servicesRaw = `
Beard Trim / Shave,BEARD,50,N/A,
Haircut,HAIRCUT,50,N/A,
Massage,MASSAGE,200,N/A,Price ranges from 200 to 600.
O3 Facial,FACIAL,4500,N/A,
Lotus Facial,FACIAL,2200,N/A,
VLCC Facial,FACIAL,1800,N/A,
Lilium Facial,FACIAL,1600,N/A,
Aroma Facial,FACIAL,1200,N/A,Price ranges from 1200 to 1500.
O3 De-Tan,FACIAL,600,N/A,
Ozone De-Tan,FACIAL,550,N/A,
L'Oréal Hair Colour,HAIR_COLOR,650,N/A,
Garnier Hair Colour,HAIR_COLOR,200,N/A,
Fruit Hair Colour,HAIR_COLOR,180,N/A,
L'Oréal Hair Spa,HAIR_SPA,600,N/A,
Ayurveda Hair Spa,HAIR_SPA,450,N/A,
Hair Curling,OTHER,2000,N/A,Price ranges from 2000 to 2500.
Hair Straightening,STRAIGHTENING,1200,N/A,Depending on length/variant price is 1200 1800 or 2200.
`;

async function main() {
  const shop = await prisma.shop.findFirst({
    where: {
      name: { contains: "Star Mens", mode: "insensitive" }
    }
  });

  if (!shop) {
    console.error("No shop found with name 'Star Mens Parlor'!");
    process.exit(1);
  }

  console.log(`Found shop: ${shop.name} (${shop.id})`);

  const lines = servicesRaw.trim().split('\n').filter(Boolean);
  
  for (const line of lines) {
    const parts = line.split(',');
    
    const name = parts[0].trim();
    let category = parts[1].trim().toUpperCase().replace(/ /g, '_');
    
    const validCategories = ['HAIRCUT','BEARD','FACIAL','MASSAGE','HAIR_COLOR','HAIR_SPA','WAXING','KERATIN','STRAIGHTENING','OTHER'];
    
    let customCategoryName: string | undefined = undefined;
    
    if (!validCategories.includes(category)) {
      if (category === 'HAIR COLOR') category = 'HAIR_COLOR';
      else if (category === 'HAIR SPA') category = 'HAIR_SPA';
      else {
        customCategoryName = parts[1].trim();
        category = 'OTHER';
      }
    }

    // Special fallback for hair curling if it's placed in OTHER
    if (category === 'OTHER' && name.toLowerCase().includes('curling')) {
        customCategoryName = 'Hair Styling';
    }

    const price = parseInt(parts[2].trim(), 10);
    const desc = parts.slice(4).join(',').trim();
    
    const durationMins = 30; // Default

    await prisma.service.create({
      data: {
        shopId: shop.id,
        name,
        category: category as any,
        customCategoryName: customCategoryName || undefined,
        price: price * 100, // to paise
        durationMins,
        description: desc || null,
        isActive: true,
      }
    });
    console.log(`Added: ${name} (Cat: ${category}, Custom: ${customCategoryName})`);
  }
  
  console.log("All done!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
