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
  
  errors.push(...basicErrors, ...infiniteLoopErrors);

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
  errors.push(...basicErrors, ...infiniteLoopErrors);

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
  errors.push(...basicErrors, ...infiniteLoopErrors);

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
  errors.push(...basicErrors);
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
  errors.push(...basicErrors);
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
