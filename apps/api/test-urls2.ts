const urls = [
  "https://images.unsplash.com/photo-1599839619722-39751411ea63",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
];

async function check() {
  for (const url of urls) {
    const res = await fetch(url + "?w=800");
    console.log(res.status + ": " + url);
  }
}
check();