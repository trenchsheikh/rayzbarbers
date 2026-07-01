const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const logoPath = path.join(__dirname, "..", "public", "images", "logo-light.png");
const appDir = path.join(__dirname, "..", "src", "app");

async function squareIcon(size, paddingRatio = 0.08) {
  const pad = Math.round(size * paddingRatio);
  const inner = size - pad * 2;

  const resized = await sharp(logoPath)
    .resize({
      width: inner,
      height: inner,
      fit: "inside",
      withoutEnlargement: false,
    })
    .toBuffer();

  const resizedMeta = await sharp(resized).metadata();
  const left = Math.round((size - (resizedMeta.width ?? inner)) / 2);
  const top = Math.round((size - (resizedMeta.height ?? inner)) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 250, g: 247, b: 242, alpha: 1 },
    },
  }).composite([{ input: resized, left, top }]);
}

async function main() {
  if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

  await (await squareIcon(32)).png().toFile(path.join(appDir, "icon.png"));
  await (await squareIcon(180)).png().toFile(path.join(appDir, "apple-icon.png"));

  const favicon32 = await (await squareIcon(32)).png().toBuffer();
  const favicon16 = await sharp(favicon32).resize(16, 16).png().toBuffer();

  await sharp(favicon32).toFile(path.join(appDir, "favicon.ico"));

  console.log("Generated icon.png, apple-icon.png, favicon.ico in src/app/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
