import { useState, useEffect } from 'react';
import { Package, Send, Code, Settings, FileJson, Cpu } from 'lucide-react';
import { useRuntimes } from '@/hooks/useFunctions';
import { motion, AnimatePresence } from 'framer-motion';
import { RealisticPen } from '@/components/ui/RealisticPen';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; // Or a custom theme
interface CourierBoxProps {
  onSend: (data: { runtime: string; handler: string; code: string; payload: string }) => Promise<void>;
  onSuccess: () => void;
  isSending: boolean;
}

export function CourierBox({ onSend, onSuccess, isSending }: CourierBoxProps) {
  const { data: runtimes = [] } = useRuntimes();
  const [runtime, setRuntime] = useState('');
  const [handler, setHandler] = useState('main.handler');
  const [code, setCode] = useState('export const handler = async (event) => {\n  console.log("Hello from Ivory Express!");\n  return { message: "Package Delivered!" };\n};');
  const [payload, setPayload] = useState('{\n  "key": "value"\n}');

  useEffect(() => {
    if (runtimes.length > 0 && !runtime) {
      setRuntime(runtimes[0].id);
    }
  }, [runtimes, runtime]);

  const [stampStatus, setStampStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Code size={14} /> Package Contents (Code)
              </label>
              <div className="relative border-2 border-gray-200 rounded bg-gray-50 focus-within:border-red-500 transition-colors overflow-hidden">
                <Editor
                  value={code}
                  onValueChange={code => setCode(code)}
                  highlight={code => highlight(code, languages.js, 'js')}
                  padding={16}
                  className="font-mono text-sm"
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: '256px',
                  }}
                  textareaClassName="focus:outline-none"
                />
                <div className="absolute top-2 right-2 text-xl text-gray-400 font-bold pointer-events-none" style={{ fontFamily: 'var(--font-hand)' }}>index.js</div>
              </div>
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
                disabled={isSending || stampStatus !== 'idle'}
                className="group relative bg-red-600 text-white px-8 py-4 rounded font-bold text-lg uppercase tracking-wider shadow-lg hover:bg-red-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSending ? 'Packing...' : 'Ship It Now'}
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
