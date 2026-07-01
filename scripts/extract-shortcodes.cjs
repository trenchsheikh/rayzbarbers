const fs = require("fs");
const h = fs.readFileSync(process.argv[2] || "tmp-reels.html", "utf8");
const reels = [...h.matchAll(/instagram\.com\/reel\/([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
const posts = [...h.matchAll(/instagram\.com\/p\/([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
const codes = [...h.matchAll(/"shortcode":"([A-Za-z0-9_-]+)"/g)].map((m) => m[1]);
console.log("reels", [...new Set(reels)].slice(0, 20));
console.log("posts", [...new Set(posts)].slice(0, 20));
console.log("shortcodes", [...new Set(codes)].slice(0, 20));
