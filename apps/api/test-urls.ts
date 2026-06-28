const urls = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035",
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881",
  "https://images.unsplash.com/photo-1512496015851-a1c84883492e",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
  "https://images.unsplash.com/photo-1522337360788-8b13fee7a3af",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6",
];

async function check() {
  for (const url of urls) {
    const res = await fetch(url + "?w=800");
    console.log(res.status + ": " + url);
  }
}
check();