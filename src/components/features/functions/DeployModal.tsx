import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Server, CheckCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSimulationStore } from '@/store/simulationStore';
import { useNavigate } from 'react-router-dom';
import { functionService } from '@/services/functionService';
import type { Runtime } from '@/types/api';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeployModal({ isOpen, onClose }: DeployModalProps) {
  const navigate = useNavigate();
  const { startSimulation, executionId } = useSimulationStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [selectedRuntime, setSelectedRuntime] = useState<string>('');
  const [handler, setHandler] = useState<string>('main.handler');
  const [payload, setPayload] = useState<string>('{}');
  const [isLoadingRuntimes, setIsLoadingRuntimes] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadRuntimes = async () => {
        setIsLoadingRuntimes(true);
        try {
          const data = await functionService.getRuntimes();
          setRuntimes(data);
          if (data.length > 0) {
            setSelectedRuntime(data[0].id);
          }
        } catch (error) {
          console.error('Failed to load runtimes', error);
        } finally {
          setIsLoadingRuntimes(false);
        }
      };
      loadRuntimes();
    }
  }, [isOpen]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const text = await file.text();
    setFileContent(text);
  };

  const handleDeploy = async () => {
    if (!selectedFile || !selectedRuntime || !fileContent) return;
    
    setIsDeploying(true);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        alert('Invalid JSON payload');
        setIsDeploying(false);
        return;
      }

      const response = await functionService.invokeFunction({
        code: fileContent,
        runtime: selectedRuntime,
        handler: handler,
        payload: parsedPayload
      });

      startSimulation();
      onClose();
      navigate(`/executions/${response.invocationId}?simulation=true`);
    } catch (error) {
      console.error('Deployment failed', error);
      alert('Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl border border-border"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-2xl font-extrabold text-foreground">Deploy Function</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <motion.div 
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Runtime Selection */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Runtime Environment</label>
                <div className="relative">
                  <select
                    value={selectedRuntime}
                    onChange={(e) => setSelectedRuntime(e.target.value)}
                    disabled={isLoadingRuntimes}
                    className="w-full appearance-none bg-muted/30 border border-border text-foreground px-6 py-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:bg-muted/50"
                  >
                    {isLoadingRuntimes ? (
                      <option>Loading runtimes...</option>
                    ) : (
                      runtimes.map((runtime) => (
                        <option key={runtime.id} value={runtime.id}>
                          {runtime.name} ({runtime.version})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Handler</label>
                <input
                  type="text"
                  value={handler}
                  onChange={(e) => setHandler(e.target.value)}
                  placeholder="e.g. main.handler"
                  className="w-full bg-muted/30 border border-border text-foreground px-6 py-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Payload Input */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Test Event JSON</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-32 bg-muted/30 border border-border text-foreground px-6 py-4 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
              />
            </div>

            {/* File Upload Area */}
            <div className="border-3 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={40} className="text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Upload Source Code</h3>
              <p className="text-muted-foreground font-medium mb-6">Select a single source file (e.g., .py, .js, .go)</p>
              <input 
                type="file" 
                className="hidden" 
                id="file-upload"
                accept=".py,.js,.ts,.go,.java,.rb,.php"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
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
                disabled={!selectedFile || !selectedRuntime || !handler || isDeploying}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? 'Deploying...' : 'Deploy & Run'}
                <ArrowRight size={24} />
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
