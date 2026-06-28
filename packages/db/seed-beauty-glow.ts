import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const servicesRaw = `
Rica Hand Wax,WAXING,499,N/A,From 'Waxing' section
Rica Leg Wax,WAXING,799,N/A,From 'Waxing' section
Normal Hand Wax,WAXING,200,N/A,From 'Waxing' section
Normal Leg Wax,WAXING,400,N/A,From 'Waxing' section
Body Wax,WAXING,1499,N/A,From 'Waxing' section
Rica Body Wax,WAXING,3000,N/A,From 'Waxing' section
Underarms,WAXING,100,N/A,From 'Waxing' section (Listed as 100/50/-)
Face Wax,WAXING,100,N/A,From 'Waxing' section
Lotus Facial,FACIAL,800,N/A,From 'Facial' section
Gold Facial,FACIAL,700,N/A,From 'Facial' section
Shahnaz Gold,FACIAL,1200,N/A,From 'Facial' section
Fruit Facial,FACIAL,600,N/A,From 'Facial' section
VLCC Facial,FACIAL,1000,N/A,From 'Facial' section
O3+ Facial,FACIAL,1700,N/A,From 'Facial' section
Diamond Facial,FACIAL,900,N/A,From 'Facial' section
Apple Facial,FACIAL,600,N/A,From 'Facial' section
Silver Facial,FACIAL,800,N/A,From 'Facial' section
Aroma Facial,FACIAL,700,N/A,From 'Facial' section
Oxy Facial,FACIAL,599,N/A,From 'Facial' section
Wine Facial,FACIAL,900,N/A,From 'Facial' section
Papaya Facial,FACIAL,599,N/A,From 'Facial' section
Hydra Facial,FACIAL,1499,N/A,Handwritten at the bottom of 'Facial' section
Aroma Head Massage,MASSAGE,150,N/A,From 'Head Massage' section
Layer,HAIR_COLOR,150,N/A,From 'Hair Highlight' section
Global Hair Colour,HAIR_COLOR,1000,N/A,From 'Colour' section
Light Makeup,OTHER,1499,N/A,From 'Make UP' section
Face Makeup,OTHER,599,N/A,From 'Make UP' section
Engagment Makeup,OTHER,2500,N/A,From 'Make UP' section (Spelled 'Engagment')
Party Makeup,OTHER,1100,N/A,From 'Make UP' section
Bridal Makeup,OTHER,8000,N/A,From 'Make UP' section
Hair Style,OTHER,300,N/A,From 'Make UP' section
Simpal Cut,HAIRCUT,100,N/A,From 'Hair Cut' section (Spelled 'Simpal')
U Shap,HAIRCUT,100,N/A,From 'Hair Cut' section (Spelled 'Shap')
V Shap,HAIRCUT,150,N/A,From 'Hair Cut' section (Spelled 'Shap')
3 Step,HAIRCUT,350,N/A,From 'Hair Cut' section
Layer,HAIRCUT,450,N/A,From 'Hair Cut' section
Front,HAIRCUT,100,N/A,From 'Hair Cut' section
Eyebrow,OTHER,20,N/A,From 'Threading Services' section
Upper Lip,OTHER,10,N/A,From 'Threading Services' section
Forehead,OTHER,10,N/A,From 'Threading Services' section
Chin / Thread,OTHER,20,N/A,From 'Threading Services' section
Lower Lip,OTHER,10,N/A,From 'Threading Services' section
Side Looks,OTHER,30,N/A,From 'Threading Services' section
Full Face Thread,OTHER,70,N/A,From 'Threading Services' section
Sara De-Tan,FACIAL,299,N/A,From 'De-Tan' section
Raaga De-Tan,FACIAL,299,N/A,From 'De-Tan' section
O3 + De-Tan,FACIAL,499,N/A,From 'De-Tan' section
Aaryan Veda De-Tan,FACIAL,249,N/A,From 'De-Tan' section
Normal De-Tan,FACIAL,199,N/A,From 'De-Tan' section
Oxy Bleach Face,FACIAL,299,N/A,From 'Bleach Face' section
O3 + Bleach Face,FACIAL,499,N/A,From 'Bleach Face' section
Gold Bleach Face,FACIAL,249,N/A,From 'Bleach Face' section
Fruit Bleach Face,FACIAL,199,N/A,From 'Bleach Face' section
Hand Bleach,OTHER,300,N/A,From 'Bleach Face' section
Full Legs Bleach,OTHER,399,N/A,From 'Bleach Face' section
Full Back / Front,OTHER,699,N/A,From 'Bleach Face' section
Half Back / Front,OTHER,399,N/A,From 'Bleach Face' section
Full Body Bleach,OTHER,999,N/A,From 'Bleach Face' section
Lotus Clean up,FACIAL,400,N/A,From 'Clean UP' section
D3 + Clean up,FACIAL,600,N/A,From 'Clean UP' section (Printed as 'D3+')
Diamond Clean up,FACIAL,399,N/A,From 'Clean UP' section
Papaya Clean up,FACIAL,350,N/A,From 'Clean UP' section
Shahnaz,FACIAL,500,N/A,From 'Clean UP' section
Dxy Clean up,FACIAL,400,N/A,From 'Clean UP' section (Printed as 'Dxy')
Wine Clean up,FACIAL,450,N/A,From 'Clean UP' section
Apple Clean up,FACIAL,300,N/A,From 'Clean UP' section
VLCC Clean up,FACIAL,500,N/A,From 'Clean UP' section
Normal Padicure,OTHER,350,N/A,From 'Padicure Manicure' section (Spelled 'Padicure')
Aroma Padicure,OTHER,450,N/A,From 'Padicure Manicure' section (Spelled 'Padicure')
Mani are Normal,OTHER,300,N/A,From 'Padicure Manicure' section
Aroma Manicure,OTHER,350,N/A,From 'Padicure Manicure' section
Normal Hair Spa,HAIR_SPA,600,N/A,From 'Hair Spa' section
Loreal Hair Spa,HAIR_SPA,1000,N/A,From 'Hair Spa' section
Matrix Hair Sp,HAIR_SPA,800,N/A,From 'Hair Spa' section (Spelled 'Sp')
`;

async function main() {
  const shop = await prisma.shop.findFirst({
    where: {
      name: { contains: "Beauty", mode: "insensitive" }
    }
  });

  if (!shop) {
    console.error("No shop found with name 'Beauty & Glow'!");
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

    if (category === 'OTHER') {
        const descMatch = parts[4]?.match(/From '(.*?)' section/);
        if (descMatch) {
            customCategoryName = descMatch[1];
        } else {
            customCategoryName = name;
        }
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