import { chromium } from "playwright";

async function fetchImage(query: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://unsplash.com/s/photos/" + encodeURIComponent(query) + "?orientation=landscape", { waitUntil: 'domcontentloaded' });
  const imageLocator = page.locator('img[src*="images.unsplash.com/photo-"]');
  await imageLocator.first().waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
  const src = await imageLocator.first().getAttribute('src').catch(() => null);
  await browser.close();
  if (src) {
    return src.split('?')[0] + "?w=800&q=75&fit=crop&auto=format";
  }
  return null;
}

async function main() {
  const queries = [
    "woman waxing salon",
    "beauty salon generic",
  ];
  for (const q of queries) {
    const url = await fetchImage(q);
    console.log(q + ": " + url);
  }
}

main().catch(console.error);
