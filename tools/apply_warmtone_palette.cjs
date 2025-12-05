#!/usr/bin/env node
const fs = require('fs');

// 01번 마스터 팔레트 (웜톤 기반) + 추가 웜톤 색상
const MASTER_PALETTE = {
  // 기본색
  white: [1, 1, 1],
  black: [0, 0, 0],
  
  // 주황/노랑 계열 (트럭, 박스 등)
  orange_bright: [1, 0.6, 0.2],
  orange_light: [0.9882, 0.7294, 0.2078],
  orange_medium: [0.9765, 0.6431, 0.2078],
  orange_dark: [0.85, 0.5, 0.15],          // 추가: 진한 주황
  
  // 건물/베이지 (노란색 계열)
  building_cream: [1, 0.9686, 0.8392],
  building_yellow: [0.8863, 0.8392, 0.6471],
  building_beige: [0.902, 0.8627, 0.7098],
  beige_warm: [0.8, 0.7765, 0.6706],
  beige_darker: [0.72, 0.67, 0.55],        // 추가: 어두운 베이지
  
  // 빨강 계열
  red_dark: [0.7608, 0, 0],
  red_medium: [0.7804, 0.149, 0.149],
  red_light: [0.9, 0.3, 0.25],             // 추가: 밝은 빨강
  
  // 하늘 (연한 파랑 유지)
  sky_light: [0.8588, 0.9333, 1],
  sky_medium: [0.7, 0.85, 0.95],           // 추가: 중간 톤 하늘
  
  // 노란색 계열 추가
  yellow_bright: [1, 0.9, 0.4],            // 추가: 밝은 노랑
  yellow_warm: [0.95, 0.8, 0.45]           // 추가: 따뜻한 노랑
};

// 색상 간 거리 계산
function colorDistance(c1, c2) {
  return Math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2);
}

// 색상 특성 분석
function analyzeColor(rgb) {
  const [r, g, b] = rgb;
  return {
    isBlack: r < 0.1 && g < 0.1 && b < 0.1,
    isWhite: r > 0.95 && g > 0.95 && b > 0.95,
    isSky: b > 0.7 && b > r && b > g,
    isDarkBlue: b > 0.4 && b > r + 0.15 && b > g + 0.15,
    isGreen: g > r && g > b && g > 0.4,
    isBeige: r > 0.7 && g > 0.5 && Math.abs(r - g) < 0.25,
    isRed: r > 0.9 && g < 0.2 && b < 0.2,
    brightness: (r + g + b) / 3
  };
}

// 웜톤 매핑 함수 (16개 유지)
function mapToWarmtone(originalColors) {
  // 01번의 12개 색상을 기본으로 하고, 추가 색상 생성
  const mapping = new Map();
  
  originalColors.forEach(rgb => {
    const key = JSON.stringify(rgb);
    const analysis = analyzeColor(rgb);
    
    // 검정/흰색은 유지
    if (analysis.isBlack) {
      mapping.set(key, MASTER_PALETTE.black);
    } else if (analysis.isWhite) {
      mapping.set(key, MASTER_PALETTE.white);
    }
    // 하늘색 → 연한 파랑 유지
    else if (analysis.isSky) {
      mapping.set(key, MASTER_PALETTE.sky_light);
    }
    // 진한 파랑 → 빨강 계열로
    else if (analysis.isDarkBlue) {
      if (analysis.brightness > 0.3) {
        mapping.set(key, MASTER_PALETTE.red_medium);
      } else {
        mapping.set(key, MASTER_PALETTE.red_dark);
      }
    }
    // 녹색 → 주황/노랑으로
    else if (analysis.isGreen) {
      if (rgb[1] > 0.7) {
        mapping.set(key, MASTER_PALETTE.orange_light);
      } else {
        mapping.set(key, MASTER_PALETTE.orange_medium);
      }
    }
    // 베이지/건물색 → 노란색 건물색으로
    else if (analysis.isBeige) {
      if (rgb[0] > 0.9) {
        mapping.set(key, MASTER_PALETTE.building_cream);
      } else if (rgb[0] > 0.8) {
        mapping.set(key, MASTER_PALETTE.building_yellow);
      } else {
        mapping.set(key, MASTER_PALETTE.beige_warm);
      }
    }
    // 빨강 유지 또는 강화
    else if (analysis.isRed) {
      mapping.set(key, MASTER_PALETTE.red_medium);
    }
    // 밝은 톤 → 주황/크림색
    else if (analysis.brightness > 0.6) {
      if (rgb[0] > rgb[2]) {
        mapping.set(key, MASTER_PALETTE.orange_light);
      } else {
        mapping.set(key, MASTER_PALETTE.building_cream);
      }
    }
    // 중간 톤 → 베이지/주황
    else if (analysis.brightness > 0.3) {
      if (rgb[0] > rgb[2]) {
        mapping.set(key, MASTER_PALETTE.beige_warm);
      } else {
        mapping.set(key, MASTER_PALETTE.building_beige);
      }
    }
    // 어두운 톤 → 빨강
    else {
      mapping.set(key, MASTER_PALETTE.red_dark);
    }
  });
  
  return mapping;
}

function walkAndReplace(obj, mapping) {
  if (Array.isArray(obj)) {
    if (obj.length >= 3 && obj.slice(0,3).every(x => typeof x === 'number' && x >= 0 && x <= 1)) {
      const key = JSON.stringify(obj.slice(0,3));
      const newColor = mapping.get(key);
      if (newColor) {
        obj[0] = newColor[0];
        obj[1] = newColor[1];
        obj[2] = newColor[2];
        return 1;
      }
    }
    let count = 0;
    for (let i = 0; i < obj.length; i++) {
      count += walkAndReplace(obj[i], mapping) || 0;
    }
    return count;
  } else if (obj && typeof obj === 'object') {
    let count = 0;
    for (const k of Object.keys(obj)) {
      count += walkAndReplace(obj[k], mapping) || 0;
    }
    return count;
  }
  return 0;
}

function collectColors(obj) {
  const colors = [];
  function walk(o) {
    if (Array.isArray(o)) {
      if (o.length >= 3 && o.slice(0,3).every(x => typeof x === 'number' && x >= 0 && x <= 1)) {
        colors.push([...o.slice(0,3)]);
      }
      o.forEach(walk);
    } else if (o && typeof o === 'object') {
      Object.values(o).forEach(walk);
    }
  }
  walk(obj);
  // 중복 제거
  const unique = [];
  const seen = new Set();
  colors.forEach(c => {
    const key = JSON.stringify(c);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  });
  return unique;
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node apply_warmtone_palette.cjs <file1.json> [<file2.json> ...]');
    process.exit(1);
  }
  
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.warn('파일을 찾을 수 없음:', file);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const originalColors = collectColors(data);
    const originalCount = originalColors.length;
    
    console.log(`\n처리 중: ${file}`);
    console.log(`  원본: ${originalCount}개 색상`);
    
    // 웜톤 매핑 생성
    const mapping = mapToWarmtone(originalColors);
    
    // 백업
    const backup = file + '.bak';
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(file, backup);
      console.log(`  백업: ${backup}`);
    }
    
    // 색상 교체
    const replaced = walkAndReplace(data, mapping);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    
    // 결과 확인
    const newColors = collectColors(data);
    console.log(`  결과: ${newColors.length}개 색상, ${replaced}개 배열 교체`);
    console.log(`  매핑된 고유 색상: ${mapping.size}개`);
  }
  
  console.log('\n✓ 완료!');
}

main();
