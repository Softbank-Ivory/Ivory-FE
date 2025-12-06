import { useState, useEffect, useMemo } from 'react';
import { Package, Send, Code, Settings, FileJson, Cpu, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRuntimes } from '@/hooks/useFunctions';
import { motion, AnimatePresence } from 'framer-motion';
import { RealisticPen } from '@/components/ui/RealisticPen';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/themes/prism.css'; // Or a custom theme
import { validateCode, type ValidationError } from '@/lib/codeValidator';
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

def handler(event):
    print("Function started")
    time.sleep(5)
    print("Processing data...")
    time.sleep(5)
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}`);
  const [payload, setPayload] = useState('{}');

  useEffect(() => {
    if (runtimes.length > 0 && !runtime) {
      // Try to find a python runtime first
      const pythonRuntime = runtimes.find(r => r.id.includes('python'));
      setRuntime(pythonRuntime ? pythonRuntime.id : runtimes[0].id);
    }
  }, [runtimes, runtime]);

  const [stampStatus, setStampStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [codeErrors, setCodeErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // 현재 선택된 runtime 객체 가져오기 (먼저 정의)
  const currentRuntime = useMemo(() => {
    return runtimes.find(r => r.id === runtime);
  }, [runtimes, runtime]);

  // Runtime에 따른 언어 매핑 (확장 가능)
  // 백엔드 응답의 name 필드("python", "nodejs", "java")를 우선 사용
  const getLanguage = (runtime: string, runtimeLanguage?: string): string => {
    // Runtime 객체의 language 필드가 있으면 우선 사용 (백엔드 name 필드에서 매핑됨)
    if (runtimeLanguage) {
      const lang = runtimeLanguage.toLowerCase().trim();
      // 백엔드 name 필드 형식 정규화
      // "nodejs" -> "javascript" (syntax highlighting과 일치시키기)
      if (lang === 'nodejs' || lang === 'node') {
        return 'javascript';
      }
      return lang;
    }
    
    // Fallback: runtime ID에서 추출
    const runtimeLower = runtime.toLowerCase();
    if (runtimeLower.includes('python')) return 'python';
    if (runtimeLower.includes('node') || runtimeLower.includes('nodejs')) return 'javascript';
    if (runtimeLower.includes('java')) return 'java';
    if (runtimeLower.includes('go')) return 'go';
    if (runtimeLower.includes('rust')) return 'rust';
    if (runtimeLower.includes('typescript') || runtimeLower.includes('ts')) return 'typescript';
    return 'unknown'; // 기본값
  };

  // 현재 언어 가져오기 (메모이제이션)
  const currentLanguage = useMemo(() => getLanguage(runtime, currentRuntime?.language), [runtime, currentRuntime?.language]);

  // Syntax highlighting 함수 (runtime 변경 시 재생성, 확장 가능)
  const highlightCode = useMemo(() => {
    return (code: string) => {
      // Prism.js가 지원하는 언어 매핑
      switch (currentLanguage) {
        case 'python':
          return highlight(code, languages.python, 'python');
        case 'javascript':
        case 'js':
          return highlight(code, languages.javascript, 'javascript');
        case 'java':
          return highlight(code, languages.clike, 'java');
        case 'go':
          // Prism.js의 Go 언어 지원 확인
          if (languages.go) {
            return highlight(code, languages.go, 'go');
          }
          return highlight(code, languages.clike, 'go');
        case 'rust':
          // Prism.js의 Rust 언어 지원 확인
          if (languages.rust) {
            return highlight(code, languages.rust, 'rust');
          }
          return highlight(code, languages.clike, 'rust');
        case 'typescript':
        case 'ts':
          // TypeScript는 JavaScript와 유사하게 처리
          return highlight(code, languages.javascript, 'typescript');
        default:
          // 알 수 없는 언어는 기본 하이라이팅 (또는 텍스트 그대로)
          return highlight(code, languages.clike, 'text');
      }
    };
  }, [currentLanguage]);

  // 코드 변경 시 자동 검사 (디바운스)
  useEffect(() => {
    if (!code || code.trim().length === 0) {
      setCodeErrors([]);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      // Runtime 객체의 language 필드를 활용
      const result = validateCode(code, runtime, currentRuntime?.language);
      setCodeErrors(result.errors);
      setIsValidating(false);
    }, 800); // 0.8초 디바운스

    return () => {
      clearTimeout(timeoutId);
      setIsValidating(false);
    };
  }, [code, runtime, currentRuntime?.language]);

  // Runtime 변경 시에도 검사
  useEffect(() => {
    if (code && code.trim().length > 0) {
      setIsValidating(true);
      const timeoutId = setTimeout(() => {
        // Runtime 객체의 language 필드를 활용
        const result = validateCode(code, runtime, currentRuntime?.language);
        setCodeErrors(result.errors);
        setIsValidating(false);
      }, 300);

      return () => {
        clearTimeout(timeoutId);
        setIsValidating(false);
      };
    }
  }, [runtime, currentRuntime?.language, code]);

  const hasErrors = codeErrors.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 최종 검사 (Runtime 객체의 language 필드 활용)
    const result = validateCode(code, runtime, currentRuntime?.language);
    setCodeErrors(result.errors);
    
    // 에러가 있으면 제출 차단
    if (!result.isValid) {
      setStampStatus('rejected');
      setTimeout(() => setStampStatus('idle'), 2000);
      return;
    }
    
    try {
      await onSend({ runtime, handler, code, payload });
      setStampStatus('approved');
      // Wait for stamp animation and user to see it
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSuccess();
      // Reset stamp after transition
      setTimeout(() => setStampStatus('idle'), 1000);
    } catch (error) {
      setStampStatus('rejected');
      // Reset stamp after a delay
      setTimeout(() => setStampStatus('idle'), 2000);
    }
  };

  return (
    <div className="relative w-full max-w-3xl perspective-1000">
      {/* The Box */}
      <motion.div 
        initial={{ rotateX: 5 }}
        className="relative texture-cardboard rounded-lg shadow-2xl border-t-4 border-l-4 border-[#c1a178] border-b-8 border-r-8 border-[#a1887f] p-8"
      >
        {/* Packing Tape */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-full texture-tape pointer-events-none z-10 border-x border-white/10" />
        
        {/* Fragile Sticker */}
        <div className="absolute -top-4 -right-4 bg-red-600 text-white font-black px-4 py-2 transform rotate-6 shadow-lg border-2 border-white z-30 text-xl tracking-widest" style={{ fontFamily: 'var(--font-hand)' }}>
          FRAGILE: CODE INSIDE
        </div>

        {/* The Label (Form) */}
        <div className="texture-paper rounded-sm p-8 relative z-20 max-w-3xl mx-auto transform -rotate-1">
          {/* Stamp Animation */}
          <AnimatePresence>
            {stampStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, scale: 2, rotate: stampStatus === 'approved' ? -15 : 15 }}
                animate={{ opacity: 0.8, scale: 1, rotate: stampStatus === 'approved' ? -15 : 15 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none border-8 ${stampStatus === 'approved' ? 'border-green-700 text-green-700' : 'border-red-700 text-red-700'} rounded-lg p-6`}
              >
                <div className="text-8xl font-black uppercase tracking-widest opacity-80 whitespace-nowrap" style={{ fontFamily: 'Impact, sans-serif' }}>
                  {stampStatus === 'approved' ? 'APPROVED' : 'REJECTED'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Label Header */}
          <div className="flex justify-between items-start border-b-2 border-red-600/20 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white p-2 rounded">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none">Ivory Express</h2>
                <p className="text-xs font-bold text-red-600 tracking-widest uppercase">Overnight Delivery</p>
              </div>
            </div>
            <div className="text-right">
              <div className="border-2 border-gray-800 px-2 py-1 inline-block transform -rotate-3">
                <span className="font-mono font-bold text-xl">PRIORITY</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Runtime Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Cpu size={14} /> Service Type (Runtime)
                </label>
                <select 
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded p-3 font-mono text-sm focus:border-red-500 focus:outline-none transition-colors"
                >
                  {runtimes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.version})</option>
                  ))}
                </select>
              </div>

              {/* Handler Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Settings size={14} /> Deliver To (Handler)
                </label>
                <input 
                  type="text" 
                  value={handler}
                  onChange={(e) => setHandler(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded p-3 font-mono text-sm focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Code Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Code size={14} /> Package Contents (Code)
                </label>
                {/* 문법 검사 상태 표시 */}
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
              <div className={`relative border-2 rounded bg-gray-50 focus-within:border-red-500 transition-colors overflow-hidden ${
                hasErrors ? 'border-red-300' : 'border-gray-200'
              }`}>
                <Editor
                  key={`editor-${currentLanguage}`} // runtime 변경 시 재마운트
                  value={code}
                  onValueChange={code => setCode(code)}
                  highlight={highlightCode}
                  padding={16}
                  className="font-mono text-sm"
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: '256px',
                  }}
                  textareaClassName="focus:outline-none"
                />
                <div className="absolute top-2 right-2 text-xl text-gray-400 font-bold pointer-events-none" style={{ fontFamily: 'var(--font-hand)' }}>
                  {currentLanguage === 'python' ? 'main.py' : 
                   currentLanguage === 'javascript' || currentLanguage === 'js' ? 'index.js' :
                   currentLanguage === 'java' ? 'Handler.java' :
                   currentLanguage === 'go' ? 'main.go' :
                   currentLanguage === 'rust' ? 'main.rs' :
                   currentLanguage === 'typescript' || currentLanguage === 'ts' ? 'index.ts' :
                   'main.txt'}
                </div>
              </div>
              {/* 에러 목록 표시 */}
              {hasErrors && codeErrors.length > 0 && (
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

            {/* Payload Editor */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <FileJson size={14} /> Special Instructions (Payload)
              </label>
              <textarea 
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full h-24 bg-gray-50 border-2 border-gray-200 rounded p-4 font-mono text-sm focus:border-red-500 focus:outline-none transition-colors resize-none"
                spellCheck={false}
              />
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
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </div>
          </form>
          
          {/* Decorative Pen */}
          <div className="absolute -right-24 bottom-12 transform rotate-12 pointer-events-none z-30">
            <RealisticPen className="w-32 h-auto filter drop-shadow-2xl" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
