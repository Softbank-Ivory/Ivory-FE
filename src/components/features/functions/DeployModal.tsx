import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Server, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRuntimes, useDeployFunction } from '@/hooks/useFunctions';
import { RuntimeSelector } from './deploy/RuntimeSelector';
import { FileUploadZone } from './deploy/FileUploadZone';
import { PayloadEditor } from './deploy/PayloadEditor';
import { useToast } from '@/context/ToastContext';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeployModal({ isOpen, onClose }: DeployModalProps) {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const { data: runtimes = [], isLoading: isLoadingRuntimes } = useRuntimes();
  const { mutateAsync: deployFunction, isPending: isDeploying } = useDeployFunction();
  const [selectedRuntime, setSelectedRuntime] = useState<string>('');
  const [handler, setHandler] = useState<string>('main.handler');
  const [payload, setPayload] = useState<string>('{}');
  const [payloadError, setPayloadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && runtimes.length > 0 && !selectedRuntime) {
      setSelectedRuntime(runtimes[0].id);
    }
  }, [isOpen, runtimes, selectedRuntime]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const text = await file.text();
    setFileContent(text);
  };

  const handleDeploy = async () => {
    if (!selectedFile || !selectedRuntime || !fileContent) return;
    
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payload);
        setPayloadError(null);
      } catch (e) {
        setPayloadError('Invalid JSON format');
        return;
      }

      const response = await deployFunction({
        code: fileContent,
        runtime: selectedRuntime,
        handler: handler,
        payload: parsedPayload
      });

      onClose();
      navigate(`/executions/${response.invocationId}?simulation=true`);
    } catch (error) {
      console.error('Deployment failed', error);
      toastError('Deployment failed. Please try again.');
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
              <RuntimeSelector 
                runtimes={runtimes}
                selectedRuntime={selectedRuntime}
                onSelect={setSelectedRuntime}
                isLoading={isLoadingRuntimes}
              />

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
            <PayloadEditor 
              payload={payload}
              setPayload={setPayload}
              error={payloadError}
              setError={setPayloadError}
            />

            {/* File Upload Area */}
            <FileUploadZone 
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />

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
