#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function walkCollect(obj, set) {
  if (Array.isArray(obj)) {
    if (obj.length >= 3 && obj.slice(0,3).every(x => typeof x === 'number')) {
      // normalize to 3-length RGB (ignore alpha for matching)
      const rgb = obj.slice(0,3).map(n => Number(n));
      set.add(JSON.stringify(rgb));
    }
    obj.forEach(o => walkCollect(o, set));
  } else if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) walkCollect(obj[k], set);
  }
}

function walkReplace(obj, map) {
  if (Array.isArray(obj)) {
    if (obj.length >= 3 && obj.slice(0,3).every(x => typeof x === 'number')) {
      const rgb = obj.slice(0,3).map(n => Number(n));
      const key = JSON.stringify(rgb);
      if (map.hasOwnProperty(key)) {
        const newRgb = map[key];
        // preserve alpha if present
        if (obj.length >= 4) {
          obj[0] = newRgb[0]; obj[1] = newRgb[1]; obj[2] = newRgb[2];
        } else {
          obj[0] = newRgb[0]; obj[1] = newRgb[1]; obj[2] = newRgb[2];
        }
        return 1;
      }
    }
    let count = 0;
    for (let i = 0; i < obj.length; i++) count += walkReplace(obj[i], map) || 0;
    return count;
  } else if (obj && typeof obj === 'object') {
    let count = 0;
    for (const k of Object.keys(obj)) count += walkReplace(obj[k], map) || 0;
    return count;
  }
  return 0;
}

function nearestColor(target, palette) {
  // target and palette items are [r,g,b]
  let best = null;
  let bestD = Infinity;
  for (const p of palette) {
    const d = (target[0]-p[0])**2 + (target[1]-p[1])**2 + (target[2]-p[2])**2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    console.error('Usage: node apply_palette_from_reference.cjs <source.json> <target1.json> [<target2.json> ...]');
    process.exit(2);
  }
  const source = argv[0];
  const targets = argv.slice(1);

  if (!fs.existsSync(source)) {
    console.error('Source file not found:', source);
    process.exit(2);
  }
  const srcJson = readJSON(source);
  const paletteSet = new Set();
  walkCollect(srcJson, paletteSet);
  const palette = [...paletteSet].map(s => JSON.parse(s));
  if (palette.length === 0) {
    console.error('No palette colors found in source file.');
    process.exit(2);
  }

  console.log('Palette colors from', source, '->', palette.length, 'unique RGB colors');

  for (const tgt of targets) {
    if (!fs.existsSync(tgt)) { console.warn('Skipping missing target:', tgt); continue; }
    const abs = tgt;
    const data = readJSON(abs);
    const targetSet = new Set();
    walkCollect(data, targetSet);
    const targetColors = [...targetSet].map(s => JSON.parse(s));
    // build mapping from target color -> nearest palette color
    const mapping = {};
    for (const tc of targetColors) {
      const nearest = nearestColor(tc, palette);
      mapping[JSON.stringify(tc)] = nearest;
    }
    // create backup
    const bak = abs + '.bak';
    if (!fs.existsSync(bak)) fs.copyFileSync(abs, bak);
    // replace in object
    const replaced = walkReplace(data, mapping);
    fs.writeFileSync(abs, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Processed ${tgt}: ${targetColors.length} unique colors, ${replaced} replacements, backup -> ${bak}`);
  }
}

main();
