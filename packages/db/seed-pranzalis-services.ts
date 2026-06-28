import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  { name: "Hair Cut", category: "HAIRCUT", price: 200, durationMins: 30, description: "Unisex professional haircut and style tailored to your facial structure." },
  { name: "Trimming", category: "HAIRCUT", price: 100, durationMins: 20, description: "Quick cleanup of split ends and length maintenance." },
  { name: "galvanic facial", category: "FACIAL", price: 1000, durationMins: 60, description: "Advanced skin rejuvenation using galvanic current." },
  { name: "Shahnaaz Facial", category: "FACIAL", price: 750, durationMins: 60, description: "Classic herbal skincare treatment by Shahnaz Husain." },
  { name: "Natures facial", category: "FACIAL", price: 1000, durationMins: 60, description: "Refreshing skin treatment with organic natural extracts." },
  { name: "Casmara", category: "FACIAL", price: 3500, durationMins: 60, description: "Premium luxury peel-off mask treatment for a glowing complexion." },
  { name: "Lotus", category: "FACIAL", price: 1200, durationMins: 60, description: "Restorative facial using professional Lotus products." },
  { name: "O3+", category: "FACIAL", price: 1800, durationMins: 60, description: "High-end brightening and anti-tan clinical facial." },
  { name: "Fruit Facial", category: "FACIAL", price: 500, durationMins: 60, description: "Gentle fruit enzyme treatment suitable for all skin types." },
  { name: "Luxury Facial", category: "FACIAL", price: 3000, durationMins: 70, description: "Elite multi-step therapeutic skin indulgence." },
  { name: "VLCC", category: "FACIAL", price: 1400, durationMins: 45, description: "Specialized skincare formulation by VLCC experts." },
  { name: "Aroma", category: "FACIAL", price: 1400, durationMins: 45, description: "Relaxing facial infused with therapeutic essential oils." },
  { name: "Herbal Facial", category: "FACIAL", price: 500, durationMins: 45, description: "Pure ayurvedic botanical blend for skin nourishment." },
  { name: "Body Massage", category: "MASSAGE", price: 2500, durationMins: 45, description: "Full body therapeutic massage for muscle relaxation and stress relief." },
  { name: "Inoa Root Touchup", category: "HAIR_COLOR", price: 1200, durationMins: 60, description: "Premium ammonia-free root gray coverage using L'Oréal INOA." },
  { name: "Hair Streaks", category: "HAIR_COLOR", price: 350, durationMins: 60, description: "Custom highlighted accents to add dimension to your hair." },
  { name: "Inoa Global Colour", category: "HAIR_COLOR", price: 2500, durationMins: 90, description: "Full head global hair transformation with ammonia-free premium color." },
  { name: "Global Colour - Ammonia Free", category: "HAIR_COLOR", price: 2500, durationMins: 90, description: "Safe and nourishing full-head rich coloration without harsh chemicals." },
  { name: "Root Touch", category: "HAIR_COLOR", price: 800, durationMins: 60, description: "Quick standard color touch-up to mask root regrowth." },
  { name: "Hair Root Touch Up - Ammonia Free", category: "HAIR_COLOR", price: 1000, durationMins: 60, description: "Gentle root coverage treatment formulated without ammonia." },
  { name: "Hair Fall Control Spa", category: "HAIR_SPA", price: 2000, durationMins: 60, description: "Targeted deep nourishment to strengthen hair roots and minimize breakage." },
  { name: "Anti Dandruff Spa", category: "HAIR_SPA", price: 2000, durationMins: 60, description: "Soothing scalp treatment designed to clarify flakes and irritation." },
  { name: "Frizzy Hair Spa", category: "HAIR_SPA", price: 1000, durationMins: 60, description: "Intense moisture lock therapy to tame unmanageable, dry hair cuticles." },
  { name: "Dry & Damaged Hair Spa", category: "HAIR_SPA", price: 1200, durationMins: 60, description: "Deep structural repair routine for weak or chemically treated hair fibers." },
  { name: "Primer", category: "HAIR_SPA", price: 1500, durationMins: 60, description: "Essential pre-treatment base shield designed to restore foundational hair nutrition." },
  { name: "Deep Conditioning", category: "HAIR_SPA", price: 500, durationMins: 60, description: "Hydrating wrap therapy ensuring immediate shine and softness." },
  { name: "Olaplex Treatment", category: "HAIR_SPA", price: 2500, durationMins: 60, description: "Premium bond-multiplying technical repair for bleached or weak hair strands." },
  { name: "Basic Spa", category: "HAIR_SPA", price: 1000, durationMins: 60, description: "Classic cream head massage accompanied by a standard steam treatment." },
  { name: "Full Body", category: "WAXING", price: 2000, durationMins: 60, description: "Full hygienic body skin exfoliation and smooth wax treatment." },
  { name: "Full Leg", category: "WAXING", price: 700, durationMins: 40, description: "Smooth hair removal for the entire length of the legs." },
  { name: "Half Leg", category: "WAXING", price: 300, durationMins: 30, description: "Smooth wax treatment focusing from the ankles up to the knees." },
  { name: "Full Arms", category: "WAXING", price: 300, durationMins: 20, description: "Complete arm wax treatment covering shoulders to wrists." },
  { name: "Half Arm", category: "WAXING", price: 150, durationMins: 30, description: "Effective hair removal for the forearms." },
  { name: "Full Face Wax", category: "WAXING", price: 150, durationMins: 20, description: "Complete facial hair removal for a smooth, makeup-ready complexion." },
  { name: "Full Face (Alternate/Rich Waxing variant)", category: "WAXING", price: 350, durationMins: 30, description: "Premium seamless full facial hair removal." },
  { name: "Upper Lips", category: "WAXING", price: 100, durationMins: 20, description: "Precision targeted delicate wax strip cleanup." },
  { name: "Sidelock", category: "WAXING", price: 50, durationMins: 15, description: "Precision facial waxing for a clean side profile and hairline." },
  { name: "Normal Under Arms", category: "WAXING", price: 50, durationMins: 15, description: "Quick underarm hygiene and hair removal." },
  { name: "Keratin Treatment", category: "KERATIN", price: 4000, durationMins: 165, description: "Protein-infusion coat to remove frizz, adding glossy, long-lasting natural straightness." },
  { name: "Botox Hair Straightening", category: "STRAIGHTENING", price: 4500, durationMins: 60, description: "Deep anti-aging smoothing process ensuring ultra-straight, silky results." },
  { name: "Smoothing", category: "STRAIGHTENING", price: 4000, durationMins: 210, description: "High-density chemical straightening giving a soft, natural look to coarse curls." },
  { name: "Rebounding", category: "STRAIGHTENING", price: 4500, durationMins: 240, description: "Permanent heavy chemical bond adjustment achieving rigid, ultra-sleek hair strands." },
  { name: "Eyebrow (Threading)", category: "OTHER", price: 30, durationMins: 10, description: "Eyebrow shaping with standard precision threading.", customCategoryName: "Threading" },
  { name: "Full Face Threading", category: "OTHER", price: 100, durationMins: 15, description: "Full facial hair shaping using classic thread techniques.", customCategoryName: "Threading" },
  { name: "Chin Threading", category: "OTHER", price: 10, durationMins: 10, description: "Quick threading removal for chin hair.", customCategoryName: "Threading" },
  { name: "Upperlip Threading", category: "OTHER", price: 20, durationMins: 10, description: "Clean upper lip hair removal via threading.", customCategoryName: "Threading" },
  { name: "Forehead Threading", category: "OTHER", price: 20, durationMins: 10, description: "Smooth forehead styling via thread alignment.", customCategoryName: "Threading" },
  { name: "Clean-Up", category: "OTHER", price: 500, durationMins: 30, description: "Deep pore cleansing, scrubbing, and instant skin refreshment.", customCategoryName: "Clean-Up" },
  { name: "shehnaz clean up", category: "OTHER", price: 350, durationMins: 30, description: "Quick herbal skin cleanup using premium Shahnaz Husain formulations.", customCategoryName: "Clean-Up" },
  { name: "De-Tan Pack", category: "OTHER", price: 400, durationMins: 30, description: "Special treatment mask designed to quickly reduce harsh sun tanning.", customCategoryName: "Clean-Up" },
  { name: "Bleach", category: "OTHER", price: 300, durationMins: 45, description: "Skin tone brightening solution for facial and body hair.", customCategoryName: "Clean-Up" },
  { name: "Nail Art & Nail Extension Combo", category: "OTHER", price: 1500, durationMins: 60, description: "Complete aesthetic upgrade combining full length extensions and creative art.", customCategoryName: "Nails" },
  { name: "Nail Extension", category: "OTHER", price: 800, durationMins: 30, description: "Durable nail extensions to add instant length, strength, and shape.", customCategoryName: "Nails" },
  { name: "Nail Art", category: "OTHER", price: 150, durationMins: 45, description: "Custom hand-painted designs, accents, or patterns on nails.", customCategoryName: "Nails" },
  { name: "Nail Paint", category: "OTHER", price: 100, durationMins: 20, description: "Quick application of vibrant premium lacquer nail shades.", customCategoryName: "Nails" },
  { name: "Luxury Manicure", category: "OTHER", price: 700, durationMins: 45, description: "Premium relaxing hand massage, scrub, cuticle trim, and intensive hydration pack.", customCategoryName: "Manicure" },
  { name: "Delux Manicure", category: "OTHER", price: 600, durationMins: 60, description: "Essential structural nail cleaning, polishing, and hydrating hand mask.", customCategoryName: "Manicure" },
  { name: "Kiana Manicure", category: "OTHER", price: 800, durationMins: 60, description: "Relaxing restorative professional hand skin brightening therapy using Kiana products.", customCategoryName: "Manicure" },
  { name: "Luxury Pedicure", category: "OTHER", price: 900, durationMins: 45, description: "Therapeutic sole scrubbing, bubble soak, and premium nail grooming.", customCategoryName: "Pedicure" },
  { name: "Deluxe Pedicure", category: "OTHER", price: 700, durationMins: 60, description: "Deep cleaning massage and standard hydration soak tailored for feet.", customCategoryName: "Pedicure" },
  { name: "Kiana Pedicure", category: "OTHER", price: 900, durationMins: 60, description: "Specialty organic branded spa formulation for tired ankles and feet.", customCategoryName: "Pedicure" },
  { name: "Pedicure (Standard)", category: "OTHER", price: 500, durationMins: 60, description: "Regular grooming cleanup to wash, exfoliate, and treat soles.", customCategoryName: "Pedicure" },
  { name: "Light Make up", category: "OTHER", price: 1000, durationMins: 60, description: "Soft, natural makeup look ideal for casual events or daytime wear.", customCategoryName: "Makeup" },
  { name: "Party Makeup", category: "OTHER", price: 1500, durationMins: 80, description: "Glamorous event makeup tailored to look striking in all lighting.", customCategoryName: "Makeup" },
  { name: "Engagement Makeup", category: "OTHER", price: 3500, durationMins: 90, description: "Exquisite, photography-ready pre-wedding makeup look.", customCategoryName: "Makeup" },
  { name: "Bridal Makeup", category: "OTHER", price: 5000, durationMins: 165, description: "Elite, long-lasting premium cosmetics configuration for your special wedding day.", customCategoryName: "Makeup" },
  { name: "Party mehendi", category: "OTHER", price: 500, durationMins: 30, description: "Beautiful Henna/Mehendi artistry for festive occasions and celebrations.", customCategoryName: "Makeup" },
  { name: "Blow Dryer", category: "OTHER", price: 300, durationMins: 60, description: "Professional high-volume blow-out styling finish.", customCategoryName: "Styling" },
  { name: "Straightening (Temporary Style)", category: "OTHER", price: 400, durationMins: 60, description: "Quick temporary straight-iron thermal profile styling for casual outings.", customCategoryName: "Styling" },
  { name: "Hair Styling", category: "OTHER", price: 700, durationMins: 60, description: "Express setting style tailored to match formal attire or party looks.", customCategoryName: "Styling" },
  { name: "Hairdo Bun", category: "OTHER", price: 500, durationMins: 60, description: "Elegant standard updo bun alignment for events.", customCategoryName: "Styling" },
  { name: "Tongs", category: "OTHER", price: 500, durationMins: 60, description: "Textured thermal iron wand waves and bouncy curls.", customCategoryName: "Styling" }
];

const categoryImageMapping = {
  HAIRCUT: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/haircut-1782629494727.jpg",
  BEARD: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/beard-1782629495606.jpg",
  FACIAL: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/facial-1782629495903.jpg",
  MASSAGE: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/massage-1782629496181.jpg",
  HAIR_COLOR: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/hair_color-1782629496470.jpg",
  HAIR_SPA: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/hair_spa-1782629496932.jpg",
  WAXING: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/waxing-1782629497239.jpg",
  KERATIN: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/keratin-1782629497758.jpg",
  STRAIGHTENING: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/straightening-1782629498084.jpg",
  OTHER: "https://lvwifbyhtmrhilrjxcdk.supabase.co/storage/v1/object/public/service-images/other-1782629498782.jpg"
};

async function main() {
  const shop = await prisma.shop.findUnique({
    where: { slug: 'pranzalis-makeover-unisex-salon-and-academy' }
  });

  if (!shop) {
    console.error("Shop 'pranzalis-makeover-unisex-salon-and-academy' not found!");
    process.exit(1);
  }
  
  // Clean up existing services for this shop before inserting to avoid duplicates
  await prisma.service.deleteMany({
    where: { shopId: shop.id }
  });
  console.log(`Deleted existing services for ${shop.name}.`);

  let count = 0;
  for (const s of services) {
    const imageUrl = categoryImageMapping[s.category] || null;
    await prisma.service.create({
      data: {
        shopId: shop.id,
        name: s.name,
        category: s.category as any,
        customCategoryName: s.customCategoryName || null,
        price: s.price * 100, // converting ₹ to paise
        durationMins: s.durationMins,
        description: s.description,
        isActive: true,
        imageUrl: imageUrl,
      }
    });
    count++;
  }

  console.log(`Successfully added ${count} services to ${shop.name}!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });