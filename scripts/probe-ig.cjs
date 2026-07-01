const fs = require("fs");
const h = fs.readFileSync("tmp-ig-html.txt", "utf8");
console.log("display_url", (h.match(/display_url/g) || []).length);
console.log("shortcode", (h.match(/shortcode/g) || []).length);
const codes = [...h.matchAll(/"code":"([A-Za-z0-9_-]{10,12})"/g)].map((m) => m[1]);
console.log("unique codes", [...new Set(codes)].slice(0, 20));
const thumbs = [...h.matchAll(/"src":"(https:\\\/\\\/[^"]+)"/g)].map((m) => m[1].replace(/\\\//g, "/"));
console.log("cdn urls", thumbs.filter((u) => u.includes("cdninstagram")).slice(0, 5));
