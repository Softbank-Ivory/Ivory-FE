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

  // Cross-language detection: JavaScript/Java 키워드 감지
  const jsKeywords = /\b(const|let|var|function|=>|console\.|require\(|module\.exports|export\s+(default\s+)?(function|const|let|var)|import\s+.*\s+from)/;
  const javaKeywords = /\b(public|private|protected|class\s+\w+|interface\s+\w+|package\s+|import\s+.*;|System\.out\.|@Override|@Deprecated)/;
  
  if (jsKeywords.test(code)) {
    errors.push({
      line: 1,
      column: 1,
      message: 'JavaScript syntax detected. Please use Python runtime or write Python code.',
      severity: 'error',
    });
  }
  
  if (javaKeywords.test(code)) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Java syntax detected. Please use Java runtime or write Python code.',
      severity: 'error',
    });
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('"""')) {
      return;
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

  // Cross-language detection: Python/Java 키워드 감지
  const pythonKeywords = /\b(def\s+\w+|import\s+\w+|from\s+\w+\s+import|print\(|if\s+.*:|for\s+.*:|while\s+.*:|class\s+\w+.*:|try:|except\s+|finally:)/;
  const javaKeywords = /\b(public|private|protected|class\s+\w+|interface\s+\w+|package\s+|System\.out\.|@Override|@Deprecated|String\s+\w+\s*=)/;
  
  if (pythonKeywords.test(code)) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Python syntax detected. Please use Python runtime or write JavaScript code.',
      severity: 'error',
    });
  }
  
  if (javaKeywords.test(code)) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Java syntax detected. Please use Java runtime or write JavaScript code.',
      severity: 'error',
    });
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
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

  // Cross-language detection: Python/JavaScript 키워드 감지
  const pythonKeywords = /\b(def\s+\w+|import\s+\w+|from\s+\w+\s+import|print\(|if\s+.*:|for\s+.*:|while\s+.*:|class\s+\w+.*:|try:|except\s+|finally:)/;
  const jsKeywords = /\b(const|let|var|function|=>|console\.|require\(|module\.exports|export\s+(default\s+)?(function|const|let|var)|import\s+.*\s+from)/;
  
  if (pythonKeywords.test(code)) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Python syntax detected. Please use Python runtime or write Java code.',
      severity: 'error',
    });
  }
  
  if (jsKeywords.test(code)) {
    errors.push({
      line: 1,
      column: 1,
      message: 'JavaScript syntax detected. Please use JavaScript runtime or write Java code.',
      severity: 'error',
    });
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 빈 줄이나 주석은 건너뛰기
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
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

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Runtime ID에서 언어 추출
 */
function extractLanguage(runtime: string, runtimeLanguage?: string): 'python' | 'javascript' | 'java' | null {
  // runtimeLanguage 필드가 있으면 우선 사용
  if (runtimeLanguage) {
    const lang = runtimeLanguage.toLowerCase();
    if (lang.includes('python')) return 'python';
    if (lang.includes('javascript') || lang.includes('js') || lang.includes('node')) return 'javascript';
    if (lang.includes('java')) return 'java';
  }
  
  // runtime ID에서 추출
  const runtimeLower = runtime.toLowerCase();
  if (runtimeLower.includes('python')) return 'python';
  if (runtimeLower.includes('node') || runtimeLower.includes('nodejs')) return 'javascript';
  if (runtimeLower.includes('java')) return 'java';
  
  return null;
}

/**
 * Runtime에 따른 코드 검사
 * @param code - 검사할 코드
 * @param runtime - Runtime ID 또는 Runtime 객체
 * @param runtimeLanguage - Runtime의 language 필드 (선택적)
 */
export function validateCode(
  code: string,
  runtime: string | { id: string; language?: string },
  runtimeLanguage?: string
): ValidationResult {
  if (!code || code.trim().length === 0) {
    return {
      isValid: true,
      errors: [],
    };
  }

  // Runtime 객체인 경우 language 필드 추출
  let runtimeId: string;
  let lang: string | undefined;
  
  if (typeof runtime === 'object') {
    runtimeId = runtime.id;
    lang = runtime.language;
  } else {
    runtimeId = runtime;
    lang = runtimeLanguage;
  }

  const detectedLanguage = extractLanguage(runtimeId, lang);
  
  if (detectedLanguage === 'python') {
    return validatePython(code);
  } else if (detectedLanguage === 'javascript') {
    return validateJavaScript(code);
  } else if (detectedLanguage === 'java') {
    return validateJava(code);
  }

  // 알 수 없는 runtime은 검사하지 않음
  return {
    isValid: true,
    errors: [],
  };
}

