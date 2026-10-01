// Generates every site icon into public/ from Melissa's 2026 flower mark
// (public/brand/mellen-mark.svg, pink #FF1392) on the logo's lavender.
//
//   node scripts/generate-icons.mjs
//
// Outputs favicon.svg (the mark, transparent), favicon.ico (16+32),
// apple-touch-icon.png (180), icon-192.png, icon-512.png and
// icon-maskable-512.png. site.webmanifest is hand-written and only references
// these files.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LAVENDER = '#D9CFF4';
const S = 512;
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));

/** The mark's drawn shapes and viewBox. The source also carries unused glyph <defs>; those are dropped. */
export function readMark(svg) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error('mark has no viewBox');
  const body = svg.replace(/<defs>[\s\S]*?<\/defs>/, '');
  const paths = body.match(/<path\b[^>]*\/>/g);
  if (!paths?.length) throw new Error('mark has no paths');
  return { viewBox: viewBox.split(/\s+/).map(Number), paths: paths.join('') };
}

/**
 * The mark in a 512 box. `size`: edge of the mark's box, centred.
 * `bg`/`radius`: optional background square. The flower's petals reach past
 * its box corners' inscribed circle, so maskable art uses a smaller `size`.
 */
export function iconSvg({ viewBox: [x, y, w], paths }, { size = S, bg, radius = 0 } = {}) {
  const k = size / w;
  const off = (S - size) / 2;
  const back = bg ? `<rect width="${S}" height="${S}" rx="${radius}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">${back}<g transform="translate(${off} ${off}) scale(${k}) translate(${-x} ${-y})">${paths}</g></svg>\n`;
}

/** ICO container holding PNG images (supported by every browser that still asks for .ico). */
export function ico(images) {
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

const png = (svg, size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

if (import.meta.url === `file://${process.argv[1]}`) {
  const mark = readMark(readFileSync(`${PUBLIC}brand/mellen-mark.svg`, 'utf8'));

  const favicon = iconSvg(mark); // transparent, edge to edge
  const app = iconSvg(mark, { size: 360, bg: LAVENDER, radius: 112 });
  const square = iconSvg(mark, { size: 360, bg: LAVENDER }); // iOS rounds it itself
  // Maskable safe zone is a circle of radius 40% (204.8px); the petals reach ~1.2x half the box.
  const maskable = iconSvg(mark, { size: 320, bg: LAVENDER });

  writeFileSync(`${PUBLIC}favicon.svg`, favicon);
  writeFileSync(`${PUBLIC}favicon.ico`, ico([
    { size: 16, data: await png(favicon, 16) },
    { size: 32, data: await png(favicon, 32) },
  ]));
  writeFileSync(`${PUBLIC}apple-touch-icon.png`, await png(square, 180));
  writeFileSync(`${PUBLIC}icon-192.png`, await png(app, 192));
  writeFileSync(`${PUBLIC}icon-512.png`, await png(app, 512));
  writeFileSync(`${PUBLIC}icon-maskable-512.png`, await png(maskable, 512));
  console.log('icons written to public/');
}
