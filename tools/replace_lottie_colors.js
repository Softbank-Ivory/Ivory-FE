const fs = require('fs');
const path = require('path');

function isColorArray(a){
  return Array.isArray(a) && a.length>=3 && a.slice(0,3).every(x=>typeof x==='number' && x>=0 && x<=1);
}

function walkReplace(obj, replacements){
  if(Array.isArray(obj)){
    for(let i=0;i<obj.length;i++){
      if(isColorArray(obj[i])){
        const [r,g,b] = obj[i];
        // blue-dominant heuristic
        if(b > r && b > g && b>0.15){
          // choose warm mapped color depending on brightness
          const brightness = Math.max(r,g,b);
          // lighter arrays -> pale warm, darker -> deep red
          if(brightness > 0.8) obj[i] = [1,0.9686,0.8392];
          else if(brightness > 0.4) obj[i] = [1,0.6,0.2];
          else obj[i] = [0.7804,0.149,0.149];
          replacements.add(JSON.stringify([r,g,b]));
        }
      }
      walkReplace(obj[i], replacements);
    }
  } else if(obj && typeof obj === 'object'){
    for(const k of Object.keys(obj)) walkReplace(obj[k], replacements);
  }
}

function processFile(filePath){
  const abs = path.resolve(filePath);
  if(!fs.existsSync(abs)){ console.error('MISSING', abs); return; }
  const raw = fs.readFileSync(abs,'utf8');
  const json = JSON.parse(raw);
  const replacements = new Set();
  walkReplace(json,replacements);
  if(replacements.size>0){
    const bak = abs + '.bak';
    fs.copyFileSync(abs,bak);
    fs.writeFileSync(abs, JSON.stringify(json));
  }
  console.log(filePath, 'replaced', replacements.size, 'unique color arrays');
  if(replacements.size>0) console.log('examples:', [...replacements].slice(0,10).join(', '));
}

const files = process.argv.slice(2);
if(files.length===0){
  console.error('Usage: node replace_lottie_colors.js <file1.json> <file2.json> ...');
  process.exit(1);
}
for(const f of files) processFile(f);
