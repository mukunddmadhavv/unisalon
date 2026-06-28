export async function fetchServiceImage(serviceName: string, category: string): Promise<string | undefined> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashKey) return undefined;

  // Enhance query to get better salon/beauty related results
  let query = `${serviceName}`;
  if (category && category !== "OTHER") {
    query = `${serviceName} ${category.replace(/_/g, ' ')}`;
  }
  
  // Add salon context if it's not already obvious
  if (!query.toLowerCase().includes('salon') && !query.toLowerCase().includes('hair') && !query.toLowerCase().includes('beauty')) {
    query += " salon beauty";
  }

  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashKey}&per_page=1&orientation=landscape`);
    
    if (!res.ok) {
      console.warn(`Unsplash API error: ${res.status} ${res.statusText}`);
      return undefined;
    }

    const data = await res.json() as any;
    if (data && data.results && data.results.length > 0) {
      // Return the regular sized image URL
      return data.results[0].urls.regular;
    }
  } catch (err) {
    console.error("Failed to fetch image from Unsplash", err);
  }
  
  return undefined;
}
