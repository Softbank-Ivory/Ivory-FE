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
 * Python 코드 문법 검사
 */
export function validatePython(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  // JavaScript 특정 키워드/문법 감지
  const javascriptKeywords = [
    /\bconst\s+\w+\s*=/,         // const (JavaScript)
    /\blet\s+\w+\s*=/,           // let (JavaScript)
    /\bvar\s+\w+\s*=/,           // var (JavaScript)
    /\bexport\s+/,               // export (JavaScript module)
    /\bfunction\s+\w+\s*\(/,     // function (JavaScript)
    /\b=>\s*\{/,                  // Arrow function
    /\bconsole\.(log|error|warn)/, // console (JavaScript)
  ];

  // Java 특정 키워드/문법 감지
  const javaKeywords = [
    /\bpublic\s+(static\s+)?(void|int|String|Object)/, // public static void main
    /\bprivate\s+(static\s+)?/,  // private static
    /\bprotected\s+(static\s+)?/, // protected static
    /\bclass\s+\w+\s*\{/,         // class Name { (Java style)
    /\bcatch\s*\(/,               // catch (Java uses catch, Python uses except)
    /\bSystem\.out\.print/,       // System.out.print (Java)
  ];

  // JavaScript 특정 키워드/문법 감지
  const javascriptKeywords = [
    /\bconst\s+\w+\s*=/,         // const (JavaScript)
    /\blet\s+\w+\s*=/,           // let (JavaScript)
    /\bvar\s+\w+\s*=/,           // var (JavaScript)
    /\bexport\s+/,               // export (JavaScript module)
    /\bfunction\s+\w+\s*\(/,     // function (JavaScript)
    /\b=>\s*\{/,                  // Arrow function
    /\bconsole\.(log|error|warn)/, // console (JavaScript)
  ];

  // Java 특정 키워드/문법 감지
  const javaKeywords = [
    /\bpublic\s+(static\s+)?(void|int|String|Object)/, // public static void main
    /\bprivate\s+(static\s+)?/,  // private static
    /\bprotected\s+(static\s+)?/, // protected static
    /\bclass\s+\w+\s*\{/,         // class Name { (Java style)
    /\bcatch\s*\(/,               // catch (Java uses catch, Python uses except)
    /\bSystem\.out\.print/,       // System.out.print (Java)
  ];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('"""')) {
      return;
    }

    // JavaScript 특정 키워드 감지
    for (const pattern of javascriptKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(const|let|var|export|function|console)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Python.',
          severity: 'error',
        });
        break;
      }
    }

    // Java 특정 키워드 감지
    for (const pattern of javaKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(public|private|protected|class|catch|System)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'Java syntax detected. This code is written for Java runtime, not Python.',
          severity: 'error',
        });
        break;
      }
    }

    // JavaScript 특정 키워드 감지
    for (const pattern of javascriptKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(const|let|var|export|function|console)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Python.',
          severity: 'error',
        });
        break;
      }
    }

    // Java 특정 키워드 감지
    for (const pattern of javaKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(public|private|protected|class|catch|System)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'Java syntax detected. This code is written for Java runtime, not Python.',
          severity: 'error',
        });
        break;
      }
    }

    // 함수/클래스/제어문 정의 후 콜론 확인
    const controlStatements = /^(def|class|if|elif|else|for|while|try|except|finally|with)\s+/;
    if (controlStatements.test(trimmed)) {
      // 콜론이 없는 경우
      if (!trimmed.endsWith(':')) {
        errors.push({
          line: lineNum,
          column: trimmed.length,
          message: 'Expected colon (:) at end of statement',
          severity: 'error',
        });
      }
    }

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

    // 문자열 따옴표 매칭 검사 (간단한 버전)
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    
    // 삼중 따옴표는 제외
    const tripleSingle = (line.match(/'''/g) || []).length;
    const tripleDouble = (line.match(/"""/g) || []).length;
    
    const actualSingle = singleQuotes - (tripleSingle * 3);
    const actualDouble = doubleQuotes - (tripleDouble * 3);
    
    if (actualSingle > 0 && actualSingle % 2 !== 0) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: 'Unmatched single quotes',
        severity: 'error',
      });
    }
    if (actualDouble > 0 && actualDouble % 2 !== 0) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: 'Unmatched double quotes',
        severity: 'error',
      });
    }
  });

  // 전체 코드에서 들여쓰기 검사 (간단한 버전)
  // 주석 처리: 현재는 사용하지 않지만 향후 개선을 위해 유지
  // let expectedIndent = 0;
  // lines.forEach((line, index) => {
  //   const trimmed = line.trim();
  //   
  //   if (!trimmed || trimmed.startsWith('#')) {
  //     return;
  //   }
  //
  //   const indent = line.length - line.trimStart().length;
  //   // 들여쓰기 검사 로직...
  // });

  // 정적 분석: 무한 루프 및 데드락 탐지
  const infiniteLoopErrors = detectInfiniteLoops(code, 'python');
  const deadlockErrors = detectDeadlocks(code, 'python');
  errors.push(...infiniteLoopErrors, ...deadlockErrors);

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

  // Python 특정 키워드/문법 감지
  const pythonKeywords = [
    /\bdef\s+\w+\s*\(/,           // def function()
    /\bclass\s+\w+\s*:/,          // class Name:
    /\belif\s+/,                  // elif (Python only)
    /\bexcept\s+/,                // except (Python uses except, JS uses catch)
    /\bpass\b/,                   // pass (Python only)
    /\bwith\s+\w+\s+as\s+/,       // with ... as (Python pattern)
    /\bprint\s*\(/,               // print() (Python style, though JS can have it)
  ];

  // 전체 코드에서 Python 패턴 검색
  // Python 특정 키워드/문법 감지
  const pythonKeywords = [
    /\bdef\s+\w+\s*\(/,           // def function()
    /\bclass\s+\w+\s*:/,          // class Name:
    /\belif\s+/,                  // elif (Python only)
    /\bexcept\s+/,                // except (Python uses except, JS uses catch)
    /\bpass\b/,                   // pass (Python only)
    /\bwith\s+\w+\s+as\s+/,       // with ... as (Python pattern)
    /\bprint\s*\(/,               // print() (Python style, though JS can have it)
  ];

  // 전체 코드에서 Python 패턴 검색
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    // Python 특정 키워드 감지
    for (const pattern of pythonKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(def|elif|except|pass|with|class)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'Python syntax detected. This code is written for Python runtime, not JavaScript.',
          severity: 'error',
        });
        break; // 한 줄에 하나의 에러만 표시
      }
    }

    // Python 스타일 제어문 (콜론으로 끝나는 제어문)
    const pythonControlStatements = /^(if|elif|else|for|while|try|except|finally|with|def|class)\s+.*[^:]$/;
    if (pythonControlStatements.test(trimmed) && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
      // JavaScript에서는 제어문이 중괄호로 시작해야 함
      // 하지만 Python 스타일로 콜론으로 끝나는 경우는 이미 위에서 감지됨
    }

    // Python 특정 키워드 감지
    for (const pattern of pythonKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(def|elif|except|pass|with|class)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'Python syntax detected. This code is written for Python runtime, not JavaScript.',
          severity: 'error',
        });
        break; // 한 줄에 하나의 에러만 표시
      }
    }

    // Python 스타일 제어문 (콜론으로 끝나는 제어문)
    const pythonControlStatements = /^(if|elif|else|for|while|try|except|finally|with|def|class)\s+.*[^:]$/;
    if (pythonControlStatements.test(trimmed) && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
      // JavaScript에서는 제어문이 중괄호로 시작해야 함
      // 하지만 Python 스타일로 콜론으로 끝나는 경우는 이미 위에서 감지됨
    }

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

    // 세미콜론 누락 검사 (선택적, 경고만)
    if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
        !trimmed.match(/^(if|else|for|while|function|const|let|var|export|import|return|break|continue)/)) {
      // 경고는 표시하지 않음 (선택적이므로)
    }
  });

  // 정적 분석: 무한 루프 및 데드락 탐지
  const infiniteLoopErrors = detectInfiniteLoops(code, 'javascript');
  const deadlockErrors = detectDeadlocks(code, 'javascript');
  errors.push(...infiniteLoopErrors, ...deadlockErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Java 코드 문법 검사 (기본 버전)
 */
export function validateJava(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  // Python 특정 키워드/문법 감지
  const pythonKeywords = [
    /\bdef\s+\w+\s*\(/,           // def function()
    /\belif\s+/,                  // elif (Python only)
    /\bexcept\s+/,               // except (Python uses except, Java uses catch)
    /\bpass\b/,                   // pass (Python only)
  ];

  // JavaScript 특정 키워드/문법 감지
  const javascriptKeywords = [
    /\bconst\s+\w+\s*=/,         // const (JavaScript, Java는 final)
    /\blet\s+\w+\s*=/,           // let (JavaScript only)
    /\bvar\s+\w+\s*=/,           // var (JavaScript, Java는 사용 안 함)
    /\bexport\s+/,                // export (JavaScript module)
    /\b=>\s*\{/,                  // Arrow function
    /\bconsole\.(log|error|warn)/, // console (JavaScript)
  ];

  // Python 특정 키워드/문법 감지
  const pythonKeywords = [
    /\bdef\s+\w+\s*\(/,           // def function()
    /\belif\s+/,                  // elif (Python only)
    /\bexcept\s+/,               // except (Python uses except, Java uses catch)
    /\bpass\b/,                   // pass (Python only)
  ];

  // JavaScript 특정 키워드/문법 감지
  const javascriptKeywords = [
    /\bconst\s+\w+\s*=/,         // const (JavaScript, Java는 final)
    /\blet\s+\w+\s*=/,           // let (JavaScript only)
    /\bvar\s+\w+\s*=/,           // var (JavaScript, Java는 사용 안 함)
    /\bexport\s+/,                // export (JavaScript module)
    /\b=>\s*\{/,                  // Arrow function
    /\bconsole\.(log|error|warn)/, // console (JavaScript)
  ];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    // Python 특정 키워드 감지
    for (const pattern of pythonKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(def|elif|except|pass)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'Python syntax detected. This code is written for Python runtime, not Java.',
          severity: 'error',
        });
        break;
      }
    }

    // JavaScript 특정 키워드 감지
    for (const pattern of javascriptKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(const|let|var|export|function|console)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Java.',
          severity: 'error',
        });
        break;
      }
    }

    // Python 특정 키워드 감지
    for (const pattern of pythonKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(def|elif|except|pass)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'Python syntax detected. This code is written for Python runtime, not Java.',
          severity: 'error',
        });
        break;
      }
    }

    // JavaScript 특정 키워드 감지
    for (const pattern of javascriptKeywords) {
      const match = trimmed.match(pattern);
      if (match) {
        const keywordMatch = trimmed.match(/\b(const|let|var|export|function|console)\b/);
        const column = keywordMatch ? keywordMatch.index || 0 : 0;
        errors.push({
          line: lineNum,
          column: column + 1, // 1-based column
          message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Java.',
          severity: 'error',
        });
        break;
      }
    }

    // 괄호 매칭 검사
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
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
    if (openBraces !== closeBraces) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: 'Unmatched curly braces',
        severity: 'error',
      });
    }

    // 세미콜론 누락 검사 (선택적)
    if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
        !trimmed.match(/^(public|private|protected|class|interface|if|else|for|while|try|catch|finally)/)) {
      // 경고는 표시하지 않음
    }
  });

  // 정적 분석: 무한 루프 및 데드락 탐지
  const infiniteLoopErrors = detectInfiniteLoops(code, 'java');
  const deadlockErrors = detectDeadlocks(code, 'java');
  errors.push(...infiniteLoopErrors, ...deadlockErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 무한 루프 패턴 탐지 (정적 분석)
 * 명시적 무한 루프와 의심스러운 루프 패턴을 감지
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

    // 명시적 무한 루프 패턴 감지
    if (language === 'python') {
      // Python: while True, while 1, for _ in iter(int, 1)
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
    } else if (language === 'javascript') {
      // JavaScript: while(true), while(1), for(;;)
      if (/^\s*while\s*\(\s*(true|1|1\s*===\s*1|1\s*==\s*1)\s*\)/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('while') + 1,
          message: 'Potential infinite loop detected: while(true/1). Consider adding a break condition or timeout.',
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
    } else if (language === 'java') {
      // Java: while(true), while(1), for(;;)
      if (/^\s*while\s*\(\s*(true|1\s*==\s*1)\s*\)/.test(trimmed)) {
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

    // 재귀 호출 깊이 경고 (간단한 패턴 매칭)
    // 같은 함수가 중첩되어 호출되는 경우 감지
    const functionDefPattern = language === 'python' 
      ? /def\s+(\w+)\s*\(/
      : language === 'javascript'
      ? /(?:function\s+)?(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s+)?\(/
      : language === 'java'
      ? /(?:public|private|protected|static)?\s*\w+\s+(\w+)\s*\(/
      : language === 'go'
      ? /func\s+(\w+)\s*\(/
      : /fn\s+(\w+)\s*\(/; // Rust
    
    const defMatch = trimmed.match(functionDefPattern);
    if (defMatch) {
      const functionName = defMatch[1] || defMatch[2];
      // 같은 함수가 호출되는지 확인 (간단한 검사)
      if (functionName && new RegExp(`\\b${functionName}\\s*\\(`).test(code)) {
        // 재귀 호출이 여러 번 중첩되는 경우 경고
        const recursiveCalls = (code.match(new RegExp(`\\b${functionName}\\s*\\(`, 'g')) || []).length;
        if (recursiveCalls > 3) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf(functionName) + 1,
            message: `Recursive function "${functionName}" detected with ${recursiveCalls} calls. Ensure there is a base case to prevent infinite recursion.`,
            severity: 'warning',
          });
        }
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
  const lockPatterns = {
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

  const patterns = lockPatterns[language as keyof typeof lockPatterns] || [];
  let hasLockOperations = false;
  const lockLines: number[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
      return;
    }

    // 락 관련 코드 감지
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
            errors.push({
              line: lineNum,
              column: trimmed.indexOf('acquire') >= 0 ? trimmed.indexOf('acquire') + 1 : trimmed.indexOf('lock') + 1,
              message: 'Lock acquired but no corresponding release/unlock found. This may cause deadlock.',
              severity: 'warning',
            });
          }
        }
        break;
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
      if (/time\.Sleep\s*\(\s*(\d+)\s*\*/.test(trimmed) || /time\.Sleep\s*\(\s*time\.(\w+)\s*\(\s*(\d+)\s*\)/.test(trimmed)) {
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
 * Validator 함수 타입
 */
type ValidatorFunction = (code: string) => ValidationResult;

/**
 * Go 코드 문법 검사 (예시)
 * 새로운 언어를 추가할 때 이 패턴을 따르면 됩니다.
 */
function validateGo(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    // Go 특정 문법 검사
    // 예: package 선언 확인, func 키워드 확인 등
    // Python/JavaScript 문법 감지
    if (/\bdef\s+\w+\s*\(/.test(trimmed)) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'Python syntax detected. This code is written for Python runtime, not Go.',
        severity: 'error',
      });
    }
    if (/\bconst\s+\w+\s*=/.test(trimmed) || /\blet\s+\w+\s*=/.test(trimmed)) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Go.',
        severity: 'error',
      });
    }
  });

  // 기본 문법 검사 추가
  const basicErrors = validateBasicSyntax(code);
  errors.push(...basicErrors);

  // 정적 분석: 무한 루프 및 데드락 탐지
  const infiniteLoopErrors = detectInfiniteLoops(code, 'go');
  const deadlockErrors = detectDeadlocks(code, 'go');
  errors.push(...infiniteLoopErrors, ...deadlockErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rust 코드 문법 검사 (예시)
 */
function validateRust(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    // Rust 특정 문법 검사
    // Python/JavaScript 문법 감지
    if (/\bdef\s+\w+\s*\(/.test(trimmed)) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'Python syntax detected. This code is written for Python runtime, not Rust.',
        severity: 'error',
      });
    }
    if (/\bconst\s+\w+\s*=/.test(trimmed) || /\blet\s+\w+\s*=/.test(trimmed)) {
      // Rust도 let을 사용하지만 문맥이 다름
      if (/\bconst\s+\w+\s*=/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: 0,
          message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Rust.',
          severity: 'error',
        });
      }
    }
  });

  // 기본 문법 검사 추가
  const basicErrors = validateBasicSyntax(code);
  errors.push(...basicErrors);

  // 정적 분석: 무한 루프 및 데드락 탐지
  const infiniteLoopErrors = detectInfiniteLoops(code, 'rust');
  const deadlockErrors = detectDeadlocks(code, 'rust');
  errors.push(...infiniteLoopErrors, ...deadlockErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
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
 * Validator 함수 타입
 */
type ValidatorFunction = (code: string) => ValidationResult;

/**
 * Go 코드 문법 검사 (예시)
 * 새로운 언어를 추가할 때 이 패턴을 따르면 됩니다.
 */
function validateGo(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    // Go 특정 문법 검사
    // 예: package 선언 확인, func 키워드 확인 등
    // Python/JavaScript 문법 감지
    if (/\bdef\s+\w+\s*\(/.test(trimmed)) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'Python syntax detected. This code is written for Python runtime, not Go.',
        severity: 'error',
      });
    }
    if (/\bconst\s+\w+\s*=/.test(trimmed) || /\blet\s+\w+\s*=/.test(trimmed)) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Go.',
        severity: 'error',
      });
    }
  });

  // 기본 문법 검사 추가
  const basicErrors = validateBasicSyntax(code);
  errors.push(...basicErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rust 코드 문법 검사 (예시)
 */
function validateRust(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    // Rust 특정 문법 검사
    // Python/JavaScript 문법 감지
    if (/\bdef\s+\w+\s*\(/.test(trimmed)) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'Python syntax detected. This code is written for Python runtime, not Rust.',
        severity: 'error',
      });
    }
    if (/\bconst\s+\w+\s*=/.test(trimmed) || /\blet\s+\w+\s*=/.test(trimmed)) {
      // Rust도 let을 사용하지만 문맥이 다름
      if (/\bconst\s+\w+\s*=/.test(trimmed)) {
        errors.push({
          line: lineNum,
          column: 0,
          message: 'JavaScript syntax detected. This code is written for JavaScript runtime, not Rust.',
          severity: 'error',
        });
      }
    }
  });

  // 기본 문법 검사 추가
  const basicErrors = validateBasicSyntax(code);
  errors.push(...basicErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 언어별 Validator 레지스트리
 * 새로운 언어를 추가할 때:
 * 1. 위에 validate[Language] 함수를 작성
 * 2. 여기에 등록
 * 3. extractLanguage 함수에 언어 감지 로직 추가 (이미 포함됨)
 */
const validatorRegistry: Record<string, ValidatorFunction> = {
  python: validatePython,
  javascript: validateJavaScript,
  java: validateJava,
  go: validateGo,        // Go validator 추가
  rust: validateRust,    // Rust validator 추가
  // 새로운 언어를 추가하려면:
  // 1. validate[Language] 함수 작성
  // 2. 여기에 등록: languageName: validate[Language]
  // 3. extractLanguage 함수에 언어 감지 로직 추가 (이미 Go, Rust는 포함됨)
};

/**
 * Runtime ID나 이름에서 언어 추출
 */
function extractLanguage(runtime: string): string {
  const runtimeLower = runtime.toLowerCase();
  
  // 명시적인 언어 매핑
  if (runtimeLower.includes('python')) return 'python';
  if (runtimeLower.includes('node') || runtimeLower.includes('nodejs')) return 'javascript';
  if (runtimeLower.includes('java')) return 'java';
  if (runtimeLower.includes('go') || runtimeLower.startsWith('go')) return 'go';
  if (runtimeLower.includes('rust')) return 'rust';
  if (runtimeLower.includes('typescript') || runtimeLower.includes('ts')) return 'typescript';
  
  // 기본값: 알 수 없는 언어
  return 'unknown';
}

/**
 * Runtime에 따른 코드 검사 (확장 가능한 버전)
 * 
 * @param code - 검사할 코드
 * @param runtime - Runtime ID 또는 Runtime 객체
 * @param runtimeLanguage - (선택) Runtime의 language 필드 (Runtime 객체에서 추출 가능)
 */
export function validateCode(
  code: string,
  runtime: string,
  runtimeLanguage?: string
  runtime: string,
  runtimeLanguage?: string
): ValidationResult {
  if (!code || code.trim().length === 0) {
    return {
      isValid: true,
      errors: [],
    };
  }

  // 언어 결정: runtimeLanguage가 제공되면 우선 사용, 없으면 runtime에서 추출
  const language = runtimeLanguage?.toLowerCase() || extractLanguage(runtime);
  
  // 등록된 validator가 있으면 상세 검사 수행
  const validator = validatorRegistry[language];
  
  if (validator) {
    // 상세 검사 수행 (기본 검사 포함)
    return validator(code);
  } else {
    // 등록되지 않은 언어는 기본 검사만 수행
    const basicErrors = validateBasicSyntax(code);
    return {
      isValid: basicErrors.length === 0,
      errors: basicErrors,
    };
  }
}

