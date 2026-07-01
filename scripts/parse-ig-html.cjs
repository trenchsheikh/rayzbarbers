const fs = require("fs");
const h = fs.readFileSync("tmp-ig-html.txt", "utf8");

// Try all application/json script blobs
const scripts = [...h.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)];
console.log("json scripts", scripts.length);

for (let i = 0; i < scripts.length; i++) {
  const raw = scripts[i][1];
  if (!raw.includes("rayzbarbers") && !raw.includes("shortcode") && !raw.includes("media")) continue;
  try {
    const j = JSON.parse(raw);
    const str = JSON.stringify(j);
    const codes = [...str.matchAll(/"shortcode":"([A-Za-z0-9_-]+)"/g)].map((m) => m[1]);
    const urls = [...str.matchAll(/"display_url":"([^"]+)"/g)].map((m) => m[1].replace(/\\u0026/g, "&").replace(/\\/g, ""));
    if (codes.length) {
      console.log("script", i, "codes", [...new Set(codes)].slice(0, 15));
      console.log("urls", urls.slice(0, 3));
    }
  } catch {
    // skip
  }
}
