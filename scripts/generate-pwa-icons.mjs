import { readFileSync, writeFileSync } from 'fs';
import { Resvg } from '@resvg/resvg-js';

const sizes = [
  { svg: 'public/icon-192.svg', png: 'public/icon-192.png', size: 192 },
  { svg: 'public/icon-512.svg', png: 'public/icon-512.png', size: 512 },
];

for (const { svg, png, size } of sizes) {
  const svgData = readFileSync(svg, 'utf-8');
  const resvg = new Resvg(svgData, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  writeFileSync(png, pngBuffer);
  console.log(`Generated ${png} (${size}x${size})`);
}
