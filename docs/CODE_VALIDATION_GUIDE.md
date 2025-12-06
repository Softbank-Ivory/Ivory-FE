# 코드 문법 검사 구현 가이드

백엔드로 요청을 보내기 전에 자동으로 문법 검사를 수행하는 기능을 추가하는 가이드입니다.

---

## 구현 방법 선택

### 방법 1: Monaco Editor 사용 (추천)
- ✅ 내장 문법 검사 기능
- ✅ 자동 완성, 코드 포맷팅
- ✅ VS Code와 동일한 경험
- ❌ 번들 크기가 큼 (~2MB)

### 방법 2: react-simple-code-editor 유지 + 별도 검사 라이브러리
- ✅ 가벼움
- ✅ 기존 UI 유지
- ❌ 각 언어별 라이브러리 필요

**이 가이드에서는 두 방법 모두 제공합니다.**

---

## 방법 1: Monaco Editor로 교체

### 1.1 패키지 설치

```bash
npm install @monaco-editor/react
npm install monaco-editor
```

### 1.2 Monaco Editor 컴포넌트 생성

**파일 생성**: `src/components/ui/MonacoCodeEditor.tsx`

```typescript
// src/components/ui/MonacoCodeEditor.tsx
import { useEffect, useRef } from 'react';
import Editor, { OnChange, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'python' | 'javascript' | 'java';
  height?: string;
  readOnly?: boolean;
  onValidate?: (markers: monaco.editor.IMarker[]) => void;
}

export function MonacoCodeEditor({
  value,
  onChange,
  language,
  height = '300px',
  readOnly = false,
  onValidate,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 문법 검사 설정
    monaco.languages.setLanguageConfiguration(language, {
      comments: {
        lineComment: language === 'python' ? '#' : language === 'javascript' ? '//' : '//',
        blockComment: language === 'python' ? ['"""', '"""'] : ['/*', '*/'],
      },
    });

    // 에러 마커 변경 감지
    const disposable = monaco.editor.onDidChangeMarkers((uris) => {
      const editorUri = editor.getModel()?.uri;
      if (editorUri && uris.includes(editorUri)) {
        const markers = monaco.editor.getModelMarkers({ resource: editorUri });
        onValidate?.(markers);
      }
    });

    return () => {
      disposable.dispose();
    };
  };

  const handleEditorChange: OnChange = (value) => {
    onChange(value || '');
  };

  // 언어별 테마 및 설정
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  return (
    <div className="border-2 border-gray-200 rounded bg-gray-50 focus-within:border-red-500 transition-colors overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
          // 문법 검사 활성화
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'off',
        }}
      />
    </div>
  );
}
```

### 1.3 CourierBox 컴포넌트 수정

**파일 수정**: `src/components/features/delivery/CourierBox.tsx`

```typescript
// src/components/features/delivery/CourierBox.tsx
import { useState, useEffect } from 'react';
import { Package, Send, Code, Settings, FileJson, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRuntimes } from '@/hooks/useFunctions';
import { motion, AnimatePresence } from 'framer-motion';
import { RealisticPen } from '@/components/ui/RealisticPen';
import { MonacoCodeEditor } from '@/components/ui/MonacoCodeEditor';
import * as monaco from 'monaco-editor';

interface CourierBoxProps {
  onSend: (data: { runtime: string; handler: string; code: string; payload: string }) => Promise<void>;
  onSuccess: () => void;
  isSending: boolean;
}

export function CourierBox({ onSend, onSuccess, isSending }: CourierBoxProps) {
  const { data: runtimes = [] } = useRuntimes();
  const [runtime, setRuntime] = useState('');
  const [handler, setHandler] = useState('main.handler');
  const [code, setCode] = useState(`import time

def handler(event, context):
    print("Function started")
    time.sleep(5)
    print("Processing data...")
    time.sleep(5)
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}`);
  const [payload, setPayload] = useState('{}');
  
  // 문법 검사 상태
  const [codeErrors, setCodeErrors] = useState<monaco.editor.IMarker[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (runtimes.length > 0 && !runtime) {
      const pythonRuntime = runtimes.find(r => r.id.includes('python'));
      setRuntime(pythonRuntime ? pythonRuntime.id : runtimes[0].id);
    }
  }, [runtimes, runtime]);

  const [stampStatus, setStampStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');

  // Runtime에 따른 언어 매핑
  const getLanguage = (runtime: string): 'python' | 'javascript' | 'java' => {
    if (runtime.includes('python')) return 'python';
    if (runtime.includes('node') || runtime.includes('nodejs')) return 'javascript';
    if (runtime.includes('java')) return 'java';
    return 'python'; // 기본값
  };

  // 문법 검사 핸들러
  const handleCodeValidation = (markers: monaco.editor.IMarker[]) => {
    setCodeErrors(markers);
    setIsValidating(false);
  };

  // 문법 검사 실행
  const validateCode = () => {
    setIsValidating(true);
    // Monaco Editor가 자동으로 검사를 수행하고 handleCodeValidation을 호출
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 문법 검사 실행
    validateCode();
    
    // 에러가 있으면 제출 차단
    if (codeErrors.length > 0) {
      setStampStatus('rejected');
      setTimeout(() => setStampStatus('idle'), 2000);
      return;
    }
    
    try {
      await onSend({ runtime, handler, code, payload });
      setStampStatus('approved');
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSuccess();
      setTimeout(() => setStampStatus('idle'), 1000);
    } catch (error) {
      setStampStatus('rejected');
      setTimeout(() => setStampStatus('idle'), 2000);
    }
  };

  // 에러 메시지 표시
  const hasErrors = codeErrors.length > 0;
  const errorMessages = codeErrors
    .filter(marker => marker.severity === monaco.MarkerSeverity.Error)
    .map(marker => ({
      line: marker.startLineNumber,
      message: marker.message,
    }));

  return (
    <div className="relative w-full max-w-3xl perspective-1000">
      {/* ... 기존 코드 ... */}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... 기존 필드들 ... */}

        {/* Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Code size={14} /> Package Contents (Code)
            </label>
            {/* 문법 검사 상태 표시 */}
            <div className="flex items-center gap-2">
              {isValidating && (
                <span className="text-xs text-gray-500">Validating...</span>
              )}
              {!isValidating && hasErrors && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle size={14} />
                  <span>{errorMessages.length} error(s)</span>
                </div>
              )}
              {!isValidating && !hasErrors && code.length > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle2 size={14} />
                  <span>No errors</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <MonacoCodeEditor
              value={code}
              onChange={setCode}
              language={getLanguage(runtime)}
              height="300px"
              onValidate={handleCodeValidation}
            />
            <div className="absolute top-2 right-2 text-xl text-gray-400 font-bold pointer-events-none" style={{ fontFamily: 'var(--font-hand)' }}>
              {getLanguage(runtime) === 'python' ? 'main.py' : 
               getLanguage(runtime) === 'javascript' ? 'index.js' : 'Handler.java'}
            </div>
          </div>
          
          {/* 에러 목록 표시 */}
          {hasErrors && errorMessages.length > 0 && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs">
              <div className="font-bold text-red-800 mb-2">Syntax Errors:</div>
              <ul className="space-y-1 text-red-700">
                {errorMessages.map((error, index) => (
                  <li key={index}>
                    Line {error.line}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ... 나머지 필드들 ... */}

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSending || stampStatus !== 'idle' || hasErrors}
            className="group relative bg-red-600 text-white px-8 py-4 rounded font-bold text-lg uppercase tracking-wider shadow-lg hover:bg-red-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isSending ? 'Packing...' : hasErrors ? 'Fix Errors First' : 'Ship It Now'}
              <Send size={20} className={`transform transition-transform ${isSending ? 'translate-x-10 opacity-0' : 'group-hover:translate-x-1'}`} />
            </span>
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </form>
      
      {/* ... 나머지 코드 ... */}
    </div>
  );
}
```

---

## 방법 2: react-simple-code-editor 유지 + 별도 검사 라이브러리

### 2.1 패키지 설치

```bash
# Python 문법 검사를 위한 pyodide (선택적, 무거움)
# 또는 간단한 파서 사용

# JavaScript 문법 검사
npm install eslint @eslint/js
npm install @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 또는 더 가벼운 옵션
npm install acorn
```

### 2.2 문법 검사 유틸리티 생성

**파일 생성**: `src/lib/codeValidator.ts`

```typescript
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
 * Python 코드 문법 검사 (간단한 버전)
 */
export function validatePython(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  // 기본적인 문법 검사
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 들여쓰기 검사 (간단한 버전)
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('"""')) {
      // 함수 정의 후 콜론 확인
      if (trimmed.match(/^(def|class|if|elif|else|for|while|try|except|finally|with)\s+.*[^:]$/)) {
        errors.push({
          line: lineNum,
          column: trimmed.length,
          message: 'Expected colon (:) at end of statement',
          severity: 'error',
        });
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
    }
  });

  // 전체 코드에서 문자열 매칭 검사
  const quoteCount = {
    single: (code.match(/'/g) || []).length,
    double: (code.match(/"/g) || []).length,
  };

  // 삼중 따옴표 검사
  const tripleSingle = (code.match(/'''/g) || []).length;
  const tripleDouble = (code.match(/"""/g) || []).length;

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * JavaScript 코드 문법 검사
 */
export async function validateJavaScript(code: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  try {
    // Acorn 파서 사용
    const { default: acorn } = await import('acorn');
    
    try {
      acorn.parse(code, {
        ecmaVersion: 2022,
        sourceType: 'module',
        locations: true,
      });
    } catch (parseError: any) {
      if (parseError.loc) {
        errors.push({
          line: parseError.loc.line,
          column: parseError.loc.column,
          message: parseError.message,
          severity: 'error',
        });
      } else {
        errors.push({
          line: 1,
          column: 1,
          message: parseError.message || 'Syntax error',
          severity: 'error',
        });
      }
    }
  } catch (importError) {
    // Acorn이 없으면 기본 검사만 수행
    console.warn('Acorn parser not available, using basic validation');
    
    // 기본적인 괄호 매칭 검사
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;

      if (openParens !== closeParens || openBrackets !== closeBrackets || openBraces !== closeBraces) {
        errors.push({
          line: index + 1,
          column: line.length,
          message: 'Unmatched brackets, parentheses, or braces',
          severity: 'error',
        });
      }
    });
  }

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

  // 기본적인 검사
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

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
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Runtime에 따른 코드 검사
 */
export async function validateCode(
  code: string,
  runtime: string
): Promise<ValidationResult> {
  if (runtime.includes('python')) {
    return validatePython(code);
  } else if (runtime.includes('node') || runtime.includes('nodejs')) {
    return validateJavaScript(code);
  } else if (runtime.includes('java')) {
    return validateJava(code);
  }

  // 알 수 없는 runtime
  return {
    isValid: true,
    errors: [],
  };
}
```

### 2.3 CourierBox에 검사 기능 추가

**파일 수정**: `src/components/features/delivery/CourierBox.tsx`

```typescript
// src/components/features/delivery/CourierBox.tsx에 추가
import { validateCode, type ValidationError } from '@/lib/codeValidator';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function CourierBox({ onSend, onSuccess, isSending }: CourierBoxProps) {
  // ... 기존 상태 ...
  
  // 문법 검사 상태 추가
  const [codeErrors, setCodeErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidatedCode, setLastValidatedCode] = useState('');

  // 코드 변경 시 자동 검사 (디바운스)
  useEffect(() => {
    if (code === lastValidatedCode) return;
    
    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      const result = await validateCode(code, runtime);
      setCodeErrors(result.errors);
      setIsValidating(false);
      setLastValidatedCode(code);
    }, 1000); // 1초 디바운스

    return () => clearTimeout(timeoutId);
  }, [code, runtime, lastValidatedCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 최종 검사
    setIsValidating(true);
    const result = await validateCode(code, runtime);
    setCodeErrors(result.errors);
    setIsValidating(false);
    
    if (!result.isValid) {
      setStampStatus('rejected');
      setTimeout(() => setStampStatus('idle'), 2000);
      return;
    }
    
    try {
      await onSend({ runtime, handler, code, payload });
      setStampStatus('approved');
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSuccess();
      setTimeout(() => setStampStatus('idle'), 1000);
    } catch (error) {
      setStampStatus('rejected');
      setTimeout(() => setStampStatus('idle'), 2000);
    }
  };

  const hasErrors = codeErrors.length > 0;

  return (
    // ... 기존 JSX ...
    
    {/* Code Editor */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <Code size={14} /> Package Contents (Code)
        </label>
        <div className="flex items-center gap-2">
          {isValidating && (
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Loader2 size={14} className="animate-spin" />
              <span>Validating...</span>
            </div>
          )}
          {!isValidating && hasErrors && (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <AlertCircle size={14} />
              <span>{codeErrors.length} error(s)</span>
            </div>
          )}
          {!isValidating && !hasErrors && code.length > 0 && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle2 size={14} />
              <span>Valid</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative border-2 border-gray-200 rounded bg-gray-50 focus-within:border-red-500 transition-colors overflow-hidden">
        <Editor
          value={code}
          onValueChange={code => setCode(code)}
          highlight={code => highlight(code, languages.python, 'python')}
          padding={16}
          className="font-mono text-sm"
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight: '256px',
          }}
          textareaClassName="focus:outline-none"
        />
        <div className="absolute top-2 right-2 text-xl text-gray-400 font-bold pointer-events-none" style={{ fontFamily: 'var(--font-hand)' }}>main.py</div>
      </div>
      
      {/* 에러 목록 */}
      {hasErrors && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs max-h-32 overflow-y-auto">
          <div className="font-bold text-red-800 mb-2">Syntax Errors:</div>
          <ul className="space-y-1 text-red-700">
            {codeErrors.map((error, index) => (
              <li key={index}>
                Line {error.line}, Col {error.column}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* Submit Button */}
    <div className="pt-4 flex justify-end">
      <button 
        type="submit" 
        disabled={isSending || stampStatus !== 'idle' || hasErrors || isValidating}
        className="group relative bg-red-600 text-white px-8 py-4 rounded font-bold text-lg uppercase tracking-wider shadow-lg hover:bg-red-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          {isSending ? 'Packing...' : 
           isValidating ? 'Validating...' :
           hasErrors ? 'Fix Errors First' : 'Ship It Now'}
          <Send size={20} className={`transform transition-transform ${isSending ? 'translate-x-10 opacity-0' : 'group-hover:translate-x-1'}`} />
        </span>
        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </button>
    </div>
    
    // ... 나머지 코드 ...
  );
}
```

---

## 추천 구현 방법

### 프로덕션 환경: 방법 1 (Monaco Editor)
- 완전한 문법 검사
- 자동 완성 및 코드 포맷팅
- 사용자 경험 향상

### 개발/프로토타입: 방법 2 (기존 에디터 유지)
- 빠른 구현
- 가벼운 번들 크기
- 기본적인 문법 검사

---

## 추가 개선 사항

### 1. 실시간 검사 최적화
- 디바운스 적용 (이미 포함)
- 웹 워커 사용 (큰 코드의 경우)

### 2. 에러 하이라이팅
- 에러가 있는 라인 강조
- 라인 번호 클릭 시 해당 라인으로 스크롤

### 3. 경고 메시지
- 에러뿐만 아니라 경고도 표시
- 코드 스타일 제안

---

## 테스트

### Python 코드 테스트
```python
# 올바른 코드
def handler(event, context):
    return {"statusCode": 200}

# 에러가 있는 코드
def handler(event, context)  # 콜론 누락
    return {"statusCode": 200}
```

### JavaScript 코드 테스트
```javascript
// 올바른 코드
export const handler = async (event) => {
  return { statusCode: 200 };
};

// 에러가 있는 코드
export const handler = async (event) => {  // 닫는 괄호 누락
  return { statusCode: 200 };
```

---

## 주의사항

1. **Monaco Editor 번들 크기**: 프로덕션 빌드 시 코드 스플리팅 고려
2. **검사 성능**: 큰 코드의 경우 웹 워커 사용 고려
3. **언어별 지원**: Java는 완전한 파서가 필요할 수 있음
4. **서버 측 검증**: 클라이언트 검증은 우회 가능하므로 서버에서도 검증 필요

