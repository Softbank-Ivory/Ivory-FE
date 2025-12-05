#!/usr/bin/env node
const fs = require('fs');

// 16개 웜톤 팔레트 (밝기 순으로 정렬된 웜톤 색상들)
const WARMTONE_PALETTE_16 = [
  [1, 1, 1],                    // 1. 흰색
  [1, 0.9686, 0.8392],          // 2. 크림색
  [1, 0.9, 0.4],                // 3. 밝은 노랑
  [0.9882, 0.7294, 0.2078],     // 4. 밝은 주황
  [1, 0.6, 0.2],                // 5. 밝은 주황2
  [0.9765, 0.6431, 0.2078],     // 6. 중간 주황
  [0.902, 0.8627, 0.7098],      // 7. 베이지
  [0.8863, 0.8392, 0.6471],     // 8. 건물 노랑
  [0.8588, 0.9333, 1],          // 9. 하늘색
  [0.85, 0.5, 0.15],            // 10. 진한 주황
  [0.8, 0.7765, 0.6706],        // 11. 따뜻한 베이지
  [0.9, 0.3, 0.25],             // 12. 밝은 빨강
  [0.7804, 0.149, 0.149],       // 13. 중간 빨강
  [0.7608, 0, 0],               // 14. 진한 빨강
  [0.72, 0.67, 0.55],           // 15. 어두운 베이지
  [0, 0, 0]                     // 16. 검정
];

function collectColors(obj, colors = new Set()) {
  if (Array.isArray(obj)) {
    if (obj.length >= 3 && obj.slice(0,3).every(x => typeof x === 'number' && x >= 0 && x <= 1)) {
      const key = JSON.stringify([
        Number(obj[0].toFixed(4)),
        Number(obj[1].toFixed(4)),
        Number(obj[2].toFixed(4))
      ]);
      colors.add(key);
    } else {
      obj.forEach(item => collectColors(item, colors));
    }
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(val => collectColors(val, colors));
  }
  return colors;
}

function walkAndReplace(obj, mapping, stats = {count: 0}) {
  if (Array.isArray(obj)) {
    if (obj.length >= 3 && obj.slice(0,3).every(x => typeof x === 'number' && x >= 0 && x <= 1)) {
      const key = JSON.stringify([
        Number(obj[0].toFixed(4)),
        Number(obj[1].toFixed(4)),
        Number(obj[2].toFixed(4))
      ]);
      const newColor = mapping.get(key);
      if (newColor) {
        obj[0] = newColor[0];
        obj[1] = newColor[1];
        obj[2] = newColor[2];
        stats.count++;
      }
    } else {
      obj.forEach(item => walkAndReplace(item, mapping, stats));
    }
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(val => walkAndReplace(val, mapping, stats));
  }
  return stats.count;
}

function processFile(filePath) {
  console.log(`\n처리 중: ${filePath}`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // 원본 색상 수집
  const originalColors = collectColors(data);
  const originalArray = Array.from(originalColors).map(s => JSON.parse(s));
  console.log(`  원본: ${originalArray.length}개 색상`);
  
  // 밝기 순으로 정렬
  const sortedOriginal = originalArray.sort((a, b) => {
    const brightA = (a[0] + a[1] + a[2]) / 3;
    const brightB = (b[0] + b[1] + b[2]) / 3;
    return brightB - brightA; // 밝은 순서
  });
  
  // 매핑 생성 (원본 16개 → 웜톤 16개)
  const mapping = new Map();
  for (let i = 0; i < sortedOriginal.length && i < WARMTONE_PALETTE_16.length; i++) {
    const key = JSON.stringify(sortedOriginal[i]);
    mapping.set(key, WARMTONE_PALETTE_16[i]);
  }
  
  // 백업
  const backupPath = filePath + '.bak';
  fs.writeFileSync(backupPath, fs.readFileSync(filePath));
  console.log(`  백업: ${backupPath}`);
  
  // 교체
  const replacements = walkAndReplace(data, mapping);
  
  // 저장
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  // 결과 색상 수집
  const resultColors = collectColors(data);
  console.log(`  결과: ${resultColors.size}개 색상, ${replacements}개 배열 교체`);
}

// 메인
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('사용법: node map_16_warmtones.cjs <file1.json> [file2.json] ...');
  process.exit(1);
}

args.forEach(processFile);
