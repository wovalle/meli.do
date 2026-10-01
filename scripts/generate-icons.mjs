// Generates every site icon into public/ from the site's own identity:
// the Instrument Serif italic of "Melissa", hot pink / cream / lavender / navy
// / butter, and the sparkle used in the hero and the OG cards.
//
//   node scripts/generate-icons.mjs [a|b|c]
//
// a = the header star on lavender, b = italic "M" on cream (default),
// c = italic "m" sticker on hot pink. Outputs favicon.svg, favicon.ico (16+32),
// apple-touch-icon.png (180), icon-192.png, icon-512.png, icon-maskable-512.png.
// site.webmanifest is hand-written and only references these files.
import satori from 'satori';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NAVY = '#1A2B4A';
const LAVENDER = '#D9D0F5';
const CREAM = '#FFF5EC';
const PINK = '#FF1493';
const BUTTER = '#FFE484';

const STAR_5PT = 'M12 1 L14 9 L22 8 L15.5 13 L18 21 L12 16 L6 21 L8.5 13 L2 8 L10 9 Z'; // header logo, 24x24
const SPARKLE = 'M24 2 L28 20 L46 24 L28 28 L24 46 L20 28 L2 24 L20 20 Z'; // hero sparkle, 48x48

const S = 512;
const OUT = fileURLToPath(new URL('../public/', import.meta.url));

async function loadItalic() {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1', {
    // Old UA so Google serves truetype (satori can't read woff2).
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1' },
  }).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error('Instrument Serif italic TTF not found');
  return fetch(url).then((r) => r.arrayBuffer());
}

/** Outline a glyph with satori and return its path `d` in a 512 box. */
async function glyphPath(font, char, { fontSize, marginTop, marginLeft }) {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: { display: 'flex', width: S, height: S, alignItems: 'center', justifyContent: 'center' },
        children: {
          type: 'div',
          props: { style: { fontFamily: 'IS', fontStyle: 'italic', fontSize, lineHeight: 1, marginTop, marginLeft }, children: char },
        },
      },
    },
    { width: S, height: S, fonts: [{ name: 'IS', data: font, style: 'italic', weight: 400 }] },
  );
  const d = svg.match(/<path fill="[^"]*" d="([^"]+)"/)?.[1];
  if (!d) throw new Error(`no outline for ${char}`);
  return d.trim();
}

const shape = (d, fill, x = 0, y = 0, scale = 1) =>
  `<path transform="translate(${x} ${y}) scale(${scale})" fill="${fill}" d="${d}"/>`;

async function design(choice, font) {
  switch (choice) {
    case 'a':
      return { bg: LAVENDER, round: 112, art: shape(STAR_5PT, PINK, 66, 66, 380 / 24) };
    case 'c':
      return {
        bg: PINK,
        round: 256,
        art:
          shape(await glyphPath(font, 'm', { fontSize: 420, marginTop: -30, marginLeft: -24 }), CREAM) +
          shape(SPARKLE, BUTTER, 378, 36, 104 / 48),
      };
    case 'b':
    default:
      return {
        bg: CREAM,
        round: 112,
        art:
          shape(await glyphPath(font, 'M', { fontSize: 400, marginTop: 40, marginLeft: -40 }), PINK) +
          shape(SPARKLE, NAVY, 384, 40, 88 / 48),
      };
  }
}

/** `round`: corner radius (0 = full-bleed square). `safe`: shrink the art into the maskable safe zone. */
function svgDoc({ bg, round, art }, { radius = round, safe = 1 } = {}) {
  const inset = (S * (1 - safe)) / 2;
  const content = safe === 1 ? art : `<g transform="translate(${inset} ${inset}) scale(${safe})">${art}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" rx="${radius}" fill="${bg}"/>${content}</svg>\n`;
}

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

/** ICO container holding PNG images (supported by every browser that still asks for .ico). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const choice = process.argv[2] ?? 'b';
const d = await design(choice, await loadItalic());

const rounded = svgDoc(d);
const square = svgDoc(d, { radius: 0 });
const maskable = svgDoc(d, { radius: 0, safe: 0.8 });

writeFileSync(`${OUT}favicon.svg`, rounded);
writeFileSync(`${OUT}favicon.ico`, ico([
  { size: 16, data: await png(rounded, 16) },
  { size: 32, data: await png(rounded, 32) },
]));
writeFileSync(`${OUT}apple-touch-icon.png`, await png(square, 180));
writeFileSync(`${OUT}icon-192.png`, await png(rounded, 192));
writeFileSync(`${OUT}icon-512.png`, await png(rounded, 512));
writeFileSync(`${OUT}icon-maskable-512.png`, await png(maskable, 512));
console.log(`icons written to public/ (option ${choice})`);
