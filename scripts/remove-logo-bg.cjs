const fs = require("fs");
const sharp = require("sharp");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public", "images");

async function removeBackground(inputPath, outputPath, mode) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  const threshold = 35;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    let isBg = false;
    if (mode === "light") {
      // White / near-white background
      isBg = r > 255 - threshold && g > 255 - threshold && b > 255 - threshold;
    } else {
      // Black / near-black background — also catch dark gray compression artifacts
      isBg = r < threshold && g < threshold && b < threshold;
    }

    if (isBg) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim() // crop excess transparent padding
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Wrote ${outputPath} (${mode})`);
}

async function main() {
  const lightSrc = path.join(publicDir, "logo-light-src.png");
  const darkSrc = path.join(publicDir, "logo-dark-src.png");

  await removeBackground(
    lightSrc,
    path.join(publicDir, "logo-light.png"),
    "light",
  );
  await removeBackground(
    darkSrc,
    path.join(publicDir, "logo-dark.png"),
    "dark",
  );
}

main().catch(console.error);
