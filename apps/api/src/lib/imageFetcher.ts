import { chromium } from "playwright";

export async function fetchServiceImage(serviceName: string, category: string): Promise<string | undefined> {
  // Enhance query to get better salon/beauty related results
  let query = `${serviceName}`;
  if (category && category !== "OTHER") {
    query = `${serviceName} ${category.replace(/_/g, ' ')}`;
  }
  
  // Add salon context if it's not already obvious
  if (!query.toLowerCase().includes('salon') && !query.toLowerCase().includes('hair') && !query.toLowerCase().includes('beauty')) {
    query += " salon beauty";
  }

  let browser;
  try {
    // Launch headless chromium
    // Note: requires `npx playwright install chromium` on the server
    browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Navigate to Unsplash search
    await page.goto(`https://unsplash.com/s/photos/${encodeURIComponent(query)}?orientation=landscape`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });
    
    // Find the first actual photo image (ignoring avatars/icons)
    const imageLocator = page.locator('img[src*="images.unsplash.com/photo-"]');
    await imageLocator.first().waitFor({ state: 'attached', timeout: 5000 });
    
    const src = await imageLocator.first().getAttribute('src');
    
    if (src) {
      // Return a clean, high-quality URL by stripping existing query params and adding our own
      const baseUrl = src.split('?')[0];
      return `${baseUrl}?w=1080&q=75&fit=crop&auto=format`;
    }
  } catch (err) {
    console.error("Failed to fetch image via Playwright scraper", err);
  } finally {
    if (browser) {
      await browser.close().catch(console.error);
    }
  }
  
  return undefined;
}
