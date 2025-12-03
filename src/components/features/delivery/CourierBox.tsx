import { useState, useEffect } from 'react';
import { Package, Send, Code, Settings, FileJson, Cpu } from 'lucide-react';
import { useRuntimes } from '@/hooks/useFunctions';
import { motion } from 'framer-motion';

interface CourierBoxProps {
  onSend: (data: { runtime: string; handler: string; code: string; payload: string }) => void;
  isSending: boolean;
}

export function CourierBox({ onSend, isSending }: CourierBoxProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend({ runtime, handler, code, payload });
  };

  return (
    <div className="relative w-full max-w-4xl perspective-1000">
      {/* The Box */}
      <motion.div 
        initial={{ rotateX: 5 }}
        className="relative bg-[#d2b48c] rounded-lg shadow-2xl border-t-4 border-l-4 border-[#c1a178] border-b-8 border-r-8 border-[#a1887f] p-8"
      >
        {/* Packing Tape */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-full bg-[#bcaaa4]/30 pointer-events-none z-10 backdrop-blur-[1px] border-x border-white/10" />
        
        {/* Fragile Sticker */}
        <div className="absolute -top-4 -right-4 bg-red-600 text-white font-black px-4 py-2 transform rotate-6 shadow-lg border-2 border-white z-20">
          FRAGILE: CODE INSIDE
        </div>

        {/* The Label (Form) */}
        <div className="bg-white rounded-sm shadow-sm p-8 relative z-20 max-w-3xl mx-auto transform -rotate-1">
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
              <div className="relative">
                <textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-64 bg-gray-50 border-2 border-gray-200 rounded p-4 font-mono text-sm leading-relaxed focus:border-red-500 focus:outline-none transition-colors resize-none"
                  spellCheck={false}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-300 font-mono">index.js</div>
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
                disabled={isSending}
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
        </div>
      </motion.div>
    </div>
  );
}
