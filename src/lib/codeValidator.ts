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

