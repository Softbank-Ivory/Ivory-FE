#!/usr/bin/env node
const fs = require('fs');

// 01번 파일의 웜톤 팔레트
const WARM_PALETTE = {
  // 주황/노랑 계열
  orange_bright: [1, 0.6, 0.2],
  orange_light: [0.9882, 0.7294, 0.2078],
  orange_medium: [0.9765, 0.6431, 0.2078],
  yellow_cream: [1, 0.9686, 0.8392],
  
  // 베이지/건물색 (노란색 계열)
  building_yellow: [0.8863, 0.8392, 0.6471],
  beige_light: [0.902, 0.8627, 0.7098],
  beige_warm: [0.8, 0.7765, 0.6706],
  
  // 빨강 계열
  red_dark: [0.7608, 0, 0],
  red_medium: [0.7804, 0.149, 0.149],
  
  // 기본색
  white: [1, 1, 1],
  black: [0, 0, 0],
  
  // 하늘 (연한 파랑 유지)
  sky: [0.8588, 0.9333, 1]
};

function colorDistance(c1, c2) {
  return Math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2);
}

function mapToWarmTone(rgb) {
  const [r, g, b] = rgb;
  
  // 검정은 유지
  if (r < 0.1 && g < 0.1 && b < 0.1) return WARM_PALETTE.black;
  
  // 흰색은 유지
  if (r > 0.95 && g > 0.95 && b > 0.95) return WARM_PALETTE.white;
  
  // 하늘색 (파랑 계열) → 연한 파랑 유지 또는 크림색으로
  if (b > 0.7 && b > r && b > g) {
    if (b > 0.95) return WARM_PALETTE.sky;
    return WARM_PALETTE.sky;
  }
  
  // 짙은 파랑 계열 → 빨강으로
  if (b > 0.4 && b > r + 0.2 && b > g + 0.2) {
    return r > 0.5 ? WARM_PALETTE.orange_medium : WARM_PALETTE.red_dark;
  }
  
  // 녹색 계열 → 주황/노랑으로
  if (g > 0.5 && g > r && g > b) {
    return g > 0.7 ? WARM_PALETTE.orange_light : WARM_PALETTE.orange_bright;
  }
  
  // 베이지/갈색 (건물) → 노란색 건물색으로
  if (r > 0.7 && g > 0.6 && Math.abs(r - g) < 0.2) {
    return WARM_PALETTE.building_yellow;
  }
  
  // 이미 웜톤인 경우 (빨강/주황) → 유지 또는 강화
  if (r > 0.9 && g > 0.5) return WARM_PALETTE.orange_light;
  if (r > 0.8 && g < 0.3) return WARM_PALETTE.red_medium;
  
  // 중간 톤 → 베이지로
  if (r > 0.5 || g > 0.5) return WARM_PALETTE.beige_warm;
  
  // 어두운 톤 → 빨강으로
  return WARM_PALETTE.red_dark;
}

function walkReplace(obj) {
  if (Array.isArray(obj)) {
    if (obj.length >= 3 && obj.slice(0,3).every(x => typeof x === 'number' && x >= 0 && x <= 1)) {
      const newColor = mapToWarmTone(obj.slice(0,3));
      obj[0] = newColor[0];
      obj[1] = newColor[1];
      obj[2] = newColor[2];
      return 1;
    }
    let count = 0;
    for (let i = 0; i < obj.length; i++) {
      count += walkReplace(obj[i]) || 0;
    }
    return count;
  } else if (obj && typeof obj === 'object') {
    let count = 0;
    for (const k of Object.keys(obj)) {
      count += walkReplace(obj[k]) || 0;
    }
    return count;
  }
  return 0;
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node convert_to_warmtone.cjs <file1.json> [<file2.json> ...]');
    process.exit(1);
  }
  
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.warn('File not found:', file);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const replaced = walkReplace(data);
    
    // 백업
    const backup = file + '.bak';
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(file, backup);
    }
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ ${file}: ${replaced}개 색상 배열을 웜톤으로 변환, 백업 → ${backup}`);
  }
}

main();
