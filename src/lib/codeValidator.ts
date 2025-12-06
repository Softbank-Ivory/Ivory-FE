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
 * Runtime에 따른 코드 검사
 */
export function validateCode(
  code: string,
  runtime: string
): ValidationResult {
  if (!code || code.trim().length === 0) {
    return {
      isValid: true,
      errors: [],
    };
  }

  const runtimeLower = runtime.toLowerCase();
  
  if (runtimeLower.includes('python')) {
    return validatePython(code);
  } else if (runtimeLower.includes('node') || runtimeLower.includes('nodejs')) {
    return validateJavaScript(code);
  } else if (runtimeLower.includes('java')) {
    return validateJava(code);
  }

  // 알 수 없는 runtime은 검사하지 않음
  return {
    isValid: true,
    errors: [],
  };
}

