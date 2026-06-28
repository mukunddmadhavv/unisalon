import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const servicesRaw = `
Foils + Global Mix Color,HAIR_COLOR,5000,N/A,
Foils,HAIR_COLOR,4000,N/A,
Global Color,HAIR_COLOR,5000,N/A,Ammonia Free
Global Color,HAIR_COLOR,3000,N/A,Matrix brand
Root Touch Up,HAIR_COLOR,1000,N/A,L'Oréal
Root Touch Up,HAIR_COLOR,800,N/A,Streax
Root Touch Up,HAIR_COLOR,1200,N/A,Ammonia Free
Keratin Treatment,KERATIN,3500,N/A,
Smoothening,STRAIGHTENING,5000,N/A,
Rebonding,STRAIGHTENING,5000,N/A,
Botox Hair Treatment,OTHER,5500,N/A,Botox Hair Treatment
Nanoplastia Treatment,OTHER,6000,N/A,Nanoplastia Treatment
Hand Wax,WAXING,300,N/A,Sleek
Full Leg Wax,WAXING,700,N/A,Sleek
Hand Wax,WAXING,500,N/A,Rica
Full Leg Wax,WAXING,1000,N/A,Rica
Back Wax,WAXING,350,N/A,Sleek
Stomach Wax,WAXING,300,N/A,Sleek
Back Wax,WAXING,500,N/A,Rica
Stomach Wax,WAXING,500,N/A,Rica
Face Wax,WAXING,150,N/A,Sleek
Face Wax,WAXING,250,N/A,Rica
Face Wax,WAXING,350,N/A,Brazilian
V Wax,WAXING,1000,N/A,
Fruit Facial,FACIAL,600,N/A,
Tea Tree Facial,FACIAL,600,N/A,
Whitening Facial,FACIAL,1000,N/A,
Oxy Facial,FACIAL,800,N/A,
Galvanic Facial,FACIAL,1000,N/A,Price written as 1000/1500/2000 depending on variant.
Gold Facial,FACIAL,1000,N/A,Alternate price 1500 listed
Diamond Facial,FACIAL,1200,N/A,Alternate price 1500 listed
Lotus Hydra Facial,FACIAL,1500,N/A,
Lotus Whitening Facial,FACIAL,2000,N/A,
Lotus Korean Miraki Facial,FACIAL,2500,N/A,
Kayakalp Korean Facial,FACIAL,2000,N/A,
O3 Whitening Facial,FACIAL,2000,N/A,
O3 Bridal Glow Facial,FACIAL,2500,N/A,
Fruit Cleanup,FACIAL,400,N/A,
Lotus Hydra Cleanup,FACIAL,700,N/A,
Pearl Cleanup,FACIAL,500,N/A,
Gold Cleanup,FACIAL,700,N/A,
Diamond Cleanup,FACIAL,1000,N/A,
O3 Cleanup,FACIAL,1000,N/A,Price is smudged/unclear in the image.
Galvanic Cleanup,FACIAL,500,N/A,
Oxy Cleanup,FACIAL,500,N/A,
Korean Cleanup,FACIAL,1000,N/A,
Whitening Cleanup,FACIAL,500,N/A,
`;

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.error("No shop found!");
    process.exit(1);
  }

  const lines = servicesRaw.trim().split('\n').filter(Boolean);
  
  await prisma.service.deleteMany({});
  
  for (const line of lines) {
    const parts = line.split(',');
    // Handle the case where description contains commas
    const name = parts[0].trim();
    let category = parts[1].trim().toUpperCase().replace(/ /g, '_');
    
    // Fix category naming for enums
    if (!['HAIRCUT','BEARD','FACIAL','MASSAGE','HAIR_COLOR','HAIR_SPA','WAXING','KERATIN','STRAIGHTENING','OTHER'].includes(category)) {
      if (category === 'HAIR COLOR') category = 'HAIR_COLOR';
      else category = 'OTHER';
    }

    const price = parseInt(parts[2].trim(), 10);
    const desc = parts.slice(4).join(',').trim();
    
    // Since duration is N/A, we use a default of 30 mins
    const durationMins = 30;

    let customCategoryName = null;
    if (category === 'OTHER') {
        customCategoryName = name.split(' ')[0]; // Basic fallback, though we can use the original category string if we passed it unmodified
    }
    // Let's re-parse properly for OTHER custom categories.
    let originalCat = parts[1].trim().toUpperCase();
    if (originalCat === 'OTHER' || !['HAIRCUT','BEARD','FACIAL','MASSAGE','HAIR_COLOR','HAIR_SPA','WAXING','KERATIN','STRAIGHTENING'].includes(category)) {
       category = 'OTHER';
       customCategoryName = parts[1].trim(); // use original string as custom cat if it was not in enum, or if it was explicitly OTHER, maybe we just use the name as fallback
    }

    // specific handling for "OTHER" in the list provided: "Botox Hair Treatment", "Nanoplastia Treatment" had category "OTHER"
    if (parts[1].trim() === 'OTHER') {
        customCategoryName = name; // Just put the service name or something
    }


    await prisma.service.create({
      data: {
        shopId: shop.id,
        name,
        category,
        customCategoryName,
        price: price * 100, // to paise
        durationMins,
        description: desc || null,
        isActive: true,
      }
    });
    console.log(`Added: ${name}`);
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