// src/lib/codeValidator.ts

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * 기본 문법 검사 (모든 언어에 공통 적용)
 * 괄호, 대괄호, 중괄호 매칭 검사
 */
function validateBasicSyntax(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 괄호 매칭 검사
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    const openBrackets = (line.match(/\[/g) || []).length;
    const closeBrackets = (line.match(/\]/g) || []).length;
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    if (openParens !== closeParens) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: 'Unmatched parentheses',
        severity: 'error',
      });
    }
    if (openBrackets !== closeBrackets) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: 'Unmatched square brackets',
        severity: 'error',
      });
    }
    if (openBraces !== closeBraces) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: 'Unmatched curly braces',
        severity: 'error',
      });
    }
  });

  return errors;
}

/**
 * 무한 루프 패턴 탐지 (정적 분석)
 */
function detectInfiniteLoops(code: string, language: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
      return;
    }

    if (language === 'python') {
      if (/^\s*while\s+(True|1|1\s*==\s*1)\s*:/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('while') + 1,
          message: 'Potential infinite loop detected: while True/1. Consider adding a break condition or timeout.',
          severity: 'warning',
        });
      }
      // for 루프에서 무한 이터레이터 사용
      if (/for\s+\w+\s+in\s+iter\(int,\s*1\)/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('for') + 1,
          message: 'Potential infinite loop detected: iter(int, 1) creates an infinite iterator.',
          severity: 'warning',
        });
      }
    } else if (language === 'javascript' || language === 'java') {
      if (/^\s*while\s*\(\s*(true|1|1\s*==\s*1)\s*\)/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('while') + 1,
          message: 'Potential infinite loop detected: while(true). Consider adding a break condition or timeout.',
          severity: 'warning',
        });
      }
      if (/^\s*for\s*\(\s*;\s*;\s*\)/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('for') + 1,
          message: 'Potential infinite loop detected: for(;;). Consider adding a break condition or timeout.',
          severity: 'warning',
        });
      }
    }
  });

  return errors;
}

/**
 * 데드락 패턴 탐지 (정적 분석)
 * 락, 세마포어, 대기 상태 관련 패턴 감지
 */
function detectDeadlocks(code: string, language: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  // 락/세마포어 관련 키워드 패턴
  const lockPatterns: Record<string, RegExp[]> = {
    python: [
      /\b(threading\.)?Lock\(\)/,
      /\b(threading\.)?RLock\(\)/,
      /\b(threading\.)?Semaphore\(\)/,
      /\b(threading\.)?Event\(\)/,
      /\b(threading\.)?Condition\(\)/,
      /\bacquire\(\)/,
      /\brelease\(\)/,
    ],
    javascript: [
      /\bnew\s+Mutex\(/,
      /\bnew\s+Semaphore\(/,
      /\bacquire\(/,
      /\brelease\(/,
      /\block\(/,
      /\bunlock\(/,
    ],
    java: [
      /\bnew\s+(ReentrantLock|Semaphore|CountDownLatch|CyclicBarrier)\(/,
      /\block\(\)/,
      /\bunlock\(\)/,
      /\bacquire\(\)/,
      /\brelease\(\)/,
      /\bwait\(\)/,
      /\bnotify\(\)/,
    ],
    go: [
      /\bsync\.(Mutex|RWMutex|Cond|WaitGroup)\(/,
      /\bLock\(\)/,
      /\bUnlock\(\)/,
      /\bRLock\(\)/,
      /\bRUnlock\(\)/,
      /\bWait\(\)/,
      /\bSignal\(\)/,
      /\bBroadcast\(\)/,
    ],
    rust: [
      /\bMutex::new\(/,
      /\bRwLock::new\(/,
      /\block\(\)/,
      /\bunlock\(\)/,
      /\bwait\(\)/,
      /\bnotify\(\)/,
      /\bnotify_all\(\)/,
    ],
  };

  const patterns = lockPatterns[language] || [];
  let hasLockOperations = false;
  const lockLines: number[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
      return;
    }

    // Python: acquire() 호출 감지 및 release() 확인
    if (language === 'python') {
      // acquire() 호출 감지 (lock.acquire(), rlock.acquire() 등)
      if (/\w+\.acquire\s*\(/.test(trimmed) || /^\s*acquire\s*\(/.test(trimmed)) {
        hasLockOperations = true;
        lockLines.push(lineNum);
        
        // 같은 함수/블록 내에서 release()가 있는지 확인
        const remainingCode = lines.slice(index).join('\n');
        // 같은 변수명으로 release() 호출이 있는지 확인 (간단한 검사)
        const hasRelease = /\.release\s*\(/.test(remainingCode) || /\brelease\s*\(/.test(remainingCode);
        
        if (!hasRelease) {
          const acquireIndex = trimmed.indexOf('acquire');
          const column = acquireIndex >= 0 ? acquireIndex + 1 : 1;
          
          errors.push({
            line: lineNum,
            column: column,
            message: 'Lock acquired but no corresponding release() found. This may cause deadlock.',
            severity: 'warning',
          });
        }
      }
      // Lock, RLock, Semaphore 생성 감지
      if (/\b(threading\.)?(Lock|RLock|Semaphore|Event|Condition)\s*\(/.test(trimmed)) {
        hasLockOperations = true;
        lockLines.push(lineNum);
      }
    } else {
      // 다른 언어: 락 관련 코드 감지
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          hasLockOperations = true;
          lockLines.push(lineNum);
          
          // acquire/lock 호출 후 release/unlock이 없는 경우 경고
          if (/(acquire|lock)\(\)/.test(trimmed)) {
            // 같은 블록 내에서 release/unlock이 있는지 확인 (간단한 검사)
            const remainingCode = lines.slice(index).join('\n');
            const hasRelease = /(release|unlock)\(\)/.test(remainingCode);
            
            if (!hasRelease) {
              const acquireIndex = trimmed.indexOf('acquire');
              const lockIndex = trimmed.indexOf('lock');
              const column = acquireIndex >= 0 ? acquireIndex + 1 : (lockIndex >= 0 ? lockIndex + 1 : 1);
              
              errors.push({
                line: lineNum,
                column: column,
                message: 'Lock acquired but no corresponding release/unlock found. This may cause deadlock.',
                severity: 'warning',
              });
            }
          }
          break;
        }
      }
    }

    // 무한 대기 패턴 감지
    if (language === 'python') {
      // time.sleep()이 매우 큰 값이거나 무한 루프 내에서만 호출되는 경우
      if (/time\.sleep\s*\(\s*(\d+)\s*\)/.test(trimmed)) {
        const sleepMatch = trimmed.match(/time\.sleep\s*\(\s*(\d+)\s*\)/);
        if (sleepMatch && parseInt(sleepMatch[1]) > 300) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('sleep') + 1,
            message: `Long sleep duration (${sleepMatch[1]}s) detected. Consider using timeout or interrupt mechanism.`,
            severity: 'warning',
          });
        }
      }
      // Condition.wait() 후 notify()가 없는 경우
      if (/\w+\.wait\s*\(/.test(trimmed) || /^\s*wait\s*\(/.test(trimmed)) {
        // Condition 객체가 있는지 확인
        if (/Condition/.test(code)) {
          const remainingCode = lines.slice(index).join('\n');
          const hasNotify = /\.notify(All)?\s*\(/.test(remainingCode) || /\bnotify(All)?\s*\(/.test(remainingCode);
          
          if (!hasNotify) {
            const waitIndex = trimmed.indexOf('wait');
            errors.push({
              line: lineNum,
              column: waitIndex >= 0 ? waitIndex + 1 : 1,
              message: 'wait() called but no corresponding notify() found. This may cause deadlock.',
              severity: 'warning',
            });
          }
        }
      }
    } else if (language === 'javascript') {
      // setTimeout/setInterval이 없는 무한 대기
      if (/await\s+new\s+Promise\s*\(/.test(trimmed) && !/resolve|reject/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('Promise') + 1,
          message: 'Promise created without resolve/reject. This may cause infinite waiting.',
          severity: 'warning',
        });
      }
    } else if (language === 'java') {
      // wait() 호출 후 notify()가 없는 경우
      if (/\bwait\s*\(/.test(trimmed)) {
        const remainingCode = lines.slice(index).join('\n');
        const hasNotify = /\bnotify(All)?\s*\(/.test(remainingCode);
        
        if (!hasNotify) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('wait') + 1,
            message: 'wait() called but no corresponding notify() found. This may cause deadlock.',
            severity: 'warning',
          });
        }
      }
    } else if (language === 'go') {
      // time.Sleep()이 매우 큰 값인 경우
      if (/time\.Sleep\s*\(\s*(\d+)/.test(trimmed)) {
        const sleepMatch = trimmed.match(/time\.Sleep\s*\(\s*(\d+)/);
        if (sleepMatch && parseInt(sleepMatch[1]) > 300) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('Sleep') + 1,
            message: `Long sleep duration detected. Consider using context with timeout or channel select.`,
            severity: 'warning',
          });
        }
      }
      // select {} 블록이 있는 경우 (무한 대기 가능)
      if (/^\s*select\s*\{/.test(trimmed)) {
        const remainingCode = lines.slice(index, Math.min(index + 10, lines.length)).join('\n');
        if (!/case\s+.*:/.test(remainingCode)) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('select') + 1,
            message: 'Empty select {} block detected. This will block forever. Consider adding cases or timeout.',
            severity: 'warning',
          });
        }
      }
    } else if (language === 'rust') {
      // thread::sleep()이 매우 큰 값인 경우
      if (/thread::sleep\s*\(\s*Duration::(\w+)\s*\(\s*(\d+)/.test(trimmed)) {
        const sleepMatch = trimmed.match(/Duration::(\w+)\s*\(\s*(\d+)/);
        if (sleepMatch && sleepMatch[1] === 'from_secs' && parseInt(sleepMatch[2]) > 300) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('sleep') + 1,
            message: `Long sleep duration (${sleepMatch[2]}s) detected. Consider using timeout or channel.`,
            severity: 'warning',
          });
        }
      }
    }
  });

  // 락이 여러 개 사용되는 경우 데드락 가능성 경고
  if (hasLockOperations && lockLines.length > 1) {
    errors.push({
      line: lockLines[0],
      column: 1,
      message: `Multiple lock operations detected (${lockLines.length} locations). Be careful about lock ordering to prevent deadlock.`,
      severity: 'warning',
    });
  }

  return errors;
}



/**
 * Python 코드 문법 검사
 */
export function validatePython(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  // 타 언어 키워드 감지
  const javascriptKeywords = [
    /\bconst\s+\w+\s*=/,         
    /\blet\s+\w+\s*=/,           
    /\bvar\s+\w+\s*=/,           
    /\bfunction\s+\w+\s*\(/,     
    /\b=>\s*\{/,                  
    /\bconsole\.(log|error|warn)/,
  ];

  const javaKeywords = [
    /\bpublic\s+(static\s+)?(void|int|String|Object)/, 
    /\bprivate\s+(static\s+)?/,  
    /\bprotected\s+(static\s+)?/, 
    /\bclass\s+\w+\s*\{/,         
    /\bcatch\s*\(/,               
    /\bSystem\.out\.print/,       
  ];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('"""')) {
      return;
    }

    for (const pattern of javascriptKeywords) {
      if (pattern.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: 1,
          message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Python.',
          severity: 'error',
        });
        break;
      }
    }

    for (const pattern of javaKeywords) {
      if (pattern.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: 1,
          message: 'Java syntax detected. This code is written for Java runtime, not Python.',
          severity: 'error',
        });
        break;
      }
    }

    // 콜론 검사
    const controlStatements = /^(def|class|if|elif|else|for|while|try|except|finally|with)\s+/;
    if (controlStatements.test(trimmed) && !trimmed.endsWith(':')) {
      errors.push({
        line: lineNum,
        column: trimmed.length,
        message: 'Expected colon (:) at end of statement',
        severity: 'error',
      });
    }
  });

  const basicErrors = validateBasicSyntax(code);
  const infiniteLoopErrors = detectInfiniteLoops(code, 'python');
  const deadlockErrors = detectDeadlocks(code, 'python');
  
  errors.push(...basicErrors, ...infiniteLoopErrors, ...deadlockErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * JavaScript 코드 문법 검사
 */
export function validateJavaScript(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  const pythonKeywords = [
    /\bdef\s+\w+\s*\(/,           
    /\belif\s+/,                  
    /\bexcept\s+/,                
    /\bpass\b/,                   
    /\bwith\s+\w+\s+as\s+/,       
    /^import\s+\w+$/,             // Python: import time
    /^from\s+\w+\s+import/,       // Python: from module import
  ];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    for (const pattern of pythonKeywords) {
      if (pattern.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: 1,
          message: 'Python syntax detected. This code is written for Python runtime, not JavaScript.',
          severity: 'error',
        });
        break;
      }
    }
  });

  const basicErrors = validateBasicSyntax(code);
  const infiniteLoopErrors = detectInfiniteLoops(code, 'javascript');
  const deadlockErrors = detectDeadlocks(code, 'javascript');
  errors.push(...basicErrors, ...infiniteLoopErrors, ...deadlockErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Java 코드 문법 검사
 */
export function validateJava(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  const pythonKeywords = [/\bdef\s+/, /\belif\s+/, /\bexcept\s+/, /\bpass\b/];
  const javascriptKeywords = [/\bconst\s+/, /\blet\s+/, /\bvar\s+/, /\bfunction\s+/, /\b=>/];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    for (const pattern of pythonKeywords) {
      if (pattern.test(trimmed)) {
        errors.push({ line: lineNum, column: 1, message: 'Python syntax detected.', severity: 'error' });
        break;
      }
    }
    for (const pattern of javascriptKeywords) {
      if (pattern.test(trimmed)) {
        errors.push({ line: lineNum, column: 1, message: 'JavaScript syntax detected.', severity: 'error' });
        break;
      }
    }
  });

  const basicErrors = validateBasicSyntax(code);
  const infiniteLoopErrors = detectInfiniteLoops(code, 'java');
  const deadlockErrors = detectDeadlocks(code, 'java');
  errors.push(...basicErrors, ...infiniteLoopErrors, ...deadlockErrors);

  return { isValid: errors.length === 0, errors };
}

/**
 * Go 코드 문법 검사
 */
function validateGo(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    if (/\bdef\s+/.test(trimmed)) errors.push({ line: lineNum, column: 1, message: 'Python syntax detected.', severity: 'error' });
    if (/\bfunction\s+/.test(trimmed)) errors.push({ line: lineNum, column: 1, message: 'JavaScript syntax detected.', severity: 'error' });
  });

  const basicErrors = validateBasicSyntax(code);
  const infiniteLoopErrors = detectInfiniteLoops(code, 'go');
  const deadlockErrors = detectDeadlocks(code, 'go');
  errors.push(...basicErrors, ...infiniteLoopErrors, ...deadlockErrors);
  return { isValid: errors.length === 0, errors };
}

/**
 * Rust 코드 문법 검사
 */
function validateRust(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    if (/\bdef\s+/.test(trimmed)) errors.push({ line: lineNum, column: 1, message: 'Python syntax detected.', severity: 'error' });
    if (/\bfunction\s+/.test(trimmed)) errors.push({ line: lineNum, column: 1, message: 'JavaScript syntax detected.', severity: 'error' });
  });

  const basicErrors = validateBasicSyntax(code);
  const infiniteLoopErrors = detectInfiniteLoops(code, 'rust');
  const deadlockErrors = detectDeadlocks(code, 'rust');
  errors.push(...basicErrors, ...infiniteLoopErrors, ...deadlockErrors);
  return { isValid: errors.length === 0, errors };
}

/**
 * 언어별 Validator 레지스트리
 */
type ValidatorFunction = (code: string) => ValidationResult;

const validatorRegistry: Record<string, ValidatorFunction> = {
  python: validatePython,
  javascript: validateJavaScript,
  java: validateJava,
  go: validateGo,
  rust: validateRust,
};

/**
 * Runtime ID나 이름에서 언어 추출
 */
function extractLanguage(runtime: string): string {
  const runtimeLower = runtime.toLowerCase();
  if (runtimeLower.includes('python')) return 'python';
  if (runtimeLower.includes('node') || runtimeLower.includes('nodejs')) return 'javascript';
  if (runtimeLower.includes('java')) return 'java';
  if (runtimeLower.includes('go') || runtimeLower.startsWith('go')) return 'go';
  if (runtimeLower.includes('rust')) return 'rust';
  if (runtimeLower.includes('typescript') || runtimeLower.includes('ts')) return 'typescript';
  return 'unknown';
}

/**
 * 언어 이름 정규화 (별칭을 표준 이름으로 변환)
 */
function normalizeLanguage(language: string): string {
  const lang = language.toLowerCase().trim();
  // 언어 별칭 정규화
  if (lang === 'js' || lang === 'nodejs' || lang === 'node') return 'javascript';
  if (lang === 'ts') return 'typescript';
  return lang;
}

/**
 * Runtime에 따른 코드 검사
 */
export function validateCode(
  code: string,
  runtime: string,
  runtimeLanguage?: string
): ValidationResult {
  if (!code || code.trim().length === 0) {
    return {
      isValid: true,
      errors: [],
    };
  }

  // runtimeLanguage가 있으면 정규화, 없으면 runtime에서 추출
  const rawLanguage = runtimeLanguage?.toLowerCase() || extractLanguage(runtime);
  const language = normalizeLanguage(rawLanguage);
  const validator = validatorRegistry[language];
  
  if (validator) {
    return validator(code);
  } else {
    const basicErrors = validateBasicSyntax(code);
    return {
      isValid: basicErrors.length === 0,
      errors: basicErrors,
    };
  }
}
