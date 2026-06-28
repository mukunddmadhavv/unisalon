import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Setup Prisma
const prisma = new PrismaClient();

// Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'service-images';

// High quality Unsplash image mapping for service categories
const categoryImages = {
  HAIRCUT: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1000",
  BEARD: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1000",
  FACIAL: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000",
  MASSAGE: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1000",
  HAIR_COLOR: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000",
  HAIR_SPA: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1000",
  WAXING: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000",
  KERATIN: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=1000",
  STRAIGHTENING: "https://images.unsplash.com/photo-1501699169021-3759ee435d66?auto=format&fit=crop&q=80&w=1000",
  OTHER: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1000"
};

async function ensureBucketExists() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    throw new Error(`Failed to list buckets: ${error.message}`);
  }

  const exists = buckets.find(b => b.name === BUCKET_NAME);
  if (!exists) {
    console.log(`Creating public bucket: ${BUCKET_NAME}...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }
  } else {
    console.log(`Bucket ${BUCKET_NAME} already exists.`);
    // Ensure it's public
    if (!exists.public) {
      console.log(`Updating bucket ${BUCKET_NAME} to be public...`);
      await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
    }
  }
}

async function uploadImageFromUrl(category: string, url: string): Promise<string> {
  const fileName = `${category.toLowerCase()}-${Date.now()}.jpg`;
  
  console.log(`Downloading ${category} image...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`Uploading ${fileName} to Supabase...`);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
    
  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }
  
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);
    
  return publicUrlData.publicUrl;
}

async function main() {
  console.log("Starting service images seeding...");
  
  await ensureBucketExists();
  
  const publicUrls: Record<string, string> = {};
  
  // 1. Download and Upload Images
  for (const [category, url] of Object.entries(categoryImages)) {
    try {
      const publicUrl = await uploadImageFromUrl(category, url);
      publicUrls[category] = publicUrl;
      console.log(`✅ Uploaded ${category}: ${publicUrl}`);
    } catch (err) {
      console.error(`❌ Error processing ${category}:`, err);
    }
  }
  
  // 2. Update Database Services
  console.log("\nUpdating database services with new image URLs...");
  const categories = Object.keys(publicUrls);
  
  for (const category of categories) {
    const imageUrl = publicUrls[category];
    // We need to cast category since Prisma generated types might be strict
    const { count } = await prisma.service.updateMany({
      where: {
        category: category as any
      },
      data: {
        imageUrl
      }
    });
    
    console.log(`Updated ${count} services in category ${category}`);
  }
  
  console.log("\nAll done seeding service images! 🎉");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });