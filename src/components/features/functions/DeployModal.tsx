import { useState, useEffect } from 'react';
import { X, Upload, Server, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '@/store/simulationStore';
import { useNavigate } from 'react-router-dom';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeployModal({ isOpen, onClose }: DeployModalProps) {
  const navigate = useNavigate();
  const { state, startSimulation, setState, addLog, executionId } = useSimulationStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Simulation Logic
  useEffect(() => {
    if (!isOpen) return;

    let timeout: ReturnType<typeof setTimeout>;

    if (state === 'UPLOADING') {
      addLog('Uploading function package...', 'INFO');
      timeout = setTimeout(() => {
        setState('ASSIGNING_RUNNER');
        addLog('Upload complete. Requesting runner...', 'INFO');
      }, 2000);
    } else if (state === 'ASSIGNING_RUNNER') {
      timeout = setTimeout(() => {
        setState('PREPARING_SANDBOX');
        addLog('Runner i-0123456789 assigned.', 'INFO');
        addLog('Initializing sandbox environment...', 'INFO');
        
        // Navigate to execution detail after a brief delay to show the "Found" state
        setTimeout(() => {
          onClose();
          navigate(`/executions/${executionId}?simulation=true`);
        }, 1500);
      }, 2500);
    }

    return () => clearTimeout(timeout);
  }, [state, isOpen]);

  const handleDeploy = () => {
    if (!selectedFile) return;
    startSimulation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-2xl font-extrabold text-foreground">Deploy Function</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {state === 'IDLE' ? (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* File Upload Area */}
                <div className="border-3 border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer group">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Upload size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Upload Function Code</h3>
                  <p className="text-muted-foreground font-medium mb-6">Drag & drop your .zip file here or click to browse</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="file-upload"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label 
                    htmlFor="file-upload"
                    className="bg-card border-2 border-primary text-primary px-8 py-3 rounded-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
                  >
                    Select File
                  </label>
                  {selectedFile && (
                    <div className="mt-4 flex items-center gap-2 text-green-600 font-bold bg-green-100 px-4 py-2 rounded-xl">
                      <CheckCircle size={18} />
                      {selectedFile.name}
                    </div>
                  )}
                </div>

                {/* Runner Pool Status Preview */}
                <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <Server size={18} />
                      Runner Pool Status
                    </h4>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">3 Active</span>
                  </div>
                  <div className="flex gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-2 flex-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-3/4" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 font-medium">
                    Estimated cold start: <span className="text-foreground font-bold">~120ms</span>
                  </p>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleDeploy}
                    disabled={!selectedFile}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deploy & Run
                    <ArrowRight size={24} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="deploying"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="py-10 flex flex-col items-center text-center space-y-8"
              >
                {/* Status Visualization */}
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 border-4 border-muted rounded-full" />
                  <motion.div 
                    className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {state === 'UPLOADING' ? (
                      <Upload size={48} className="text-primary" />
                    ) : (
                      <Server size={48} className="text-primary" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-foreground mb-2">
                    {state === 'UPLOADING' ? 'Uploading Package...' : 'Assigning Runner...'}
                  </h3>
                  <p className="text-muted-foreground font-medium">
                    {state === 'UPLOADING' 
                      ? 'Compressing and transferring assets' 
                      : 'Searching for optimal execution environment'}
                  </p>
                </div>

                {/* Log Preview */}
                <div className="w-full bg-[#4E342E] rounded-2xl p-4 text-left font-mono text-xs h-32 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#4E342E]/90 pointer-events-none" />
                  <div className="space-y-1">
                    {useSimulationStore.getState().logs.map((log, i) => (
                      <div key={i} className="text-[#D7CCC8]">{log}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
