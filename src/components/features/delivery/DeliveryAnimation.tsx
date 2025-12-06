import { useState } from 'react';
import { DeliveryMap } from './DeliveryMap';
import { MapAgent } from './MapAgent';
import { StatusBubble } from './StatusBubble';
import { LogViewer } from './LogViewer';
import { ExecutionResultModal } from './ExecutionResultModal';
import { useExecutionContext, type ActiveExecution } from '@/contexts/ExecutionContext';
import { ROUTE_PATH, POI_COORDINATES } from './constants';

export function DeliveryAnimation() {
  const { executions, removeExecution } = useExecutionContext();
  const [showLogs, setShowLogs] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ActiveExecution | null>(null);

  // Collate all logs from all active executions (or just the first one if preferred)
  // Flatten and sort by timestamp if needed, or just take the latest active one.
  // For simplicity, let's merge them all.
  const allLogs = executions.flatMap(e => e.logs).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="absolute inset-0 z-0 bg-[#e0ded6] overflow-hidden">
      {/* 
        Full Screen Map Container 
        Using w-full h-full to cover the right panel space.
        DeliveryMap (SVG) will scale to cover or contain as defined.
      */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Unified Aspect Ratio Container */}
        {/* This container defines the geometry for BOTH the map image and the agent overlay */}
        <div className="relative aspect-[1212/1325] w-full h-full max-w-full max-h-full flex items-center justify-center">
            
            {/* 1. Underlying Map Layer */}
            <div className="absolute inset-0 z-0">
               <DeliveryMap />
               {/* Vignette Overlay for Soft Edges */}
               <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_60px_30px_#e0ded6]" />
            </div>

            {/* 1.5 Route Path Layer (Above Vignette) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                 <svg
                  viewBox="0 0 1212 1325"
                  className="w-full h-full"
                  preserveAspectRatio="none" 
                  style={{ overflow: 'visible' }}
                >
                  {/* Dashed Path */}
                  <path
                    d={ROUTE_PATH}
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="15 15"
                    fill="none"
                    opacity="0.8"
                  />
                  {/* Start Point */}
                   <circle cx={POI_COORDINATES.START.x} cy={POI_COORDINATES.START.y} r="12" fill="#22c55e" stroke="white" strokeWidth="4" />
                   {/* End Point */}
                   <circle cx={POI_COORDINATES.END.x} cy={POI_COORDINATES.END.y} r="12" fill="#ef4444" stroke="white" strokeWidth="4" />
                </svg>
            </div>

            {/* 2. Agent Overlay Layer */}
            <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
                {executions.map((exec, index) => {
                    return (
                        <div key={exec.id}>
                            <div className="pointer-events-auto"> {/* Enable clicks for children */}
                                <MapAgent 
                                    status={exec.status}
                                    color={['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][index % 4]} 
                                    onClick={() => {
                                        setSelectedResult(exec);
                                        removeExecution(exec.id);
                                    }}
                                />
                            </div>
                            <StatusBubble status={exec.status} />
                        </div>
                    );
                })}
            </div>
            
             {/* Result Modal (Scoped to Map Area) */}
             <ExecutionResultModal 
                execution={selectedResult} 
                onClose={() => setSelectedResult(null)} 
             />

        </div>
      </div>

      {/* Log Viewer Modal (Absolute Positioned in this Right Panel) */}
      <LogViewer 
        logs={allLogs}
        isOpen={showLogs}
        isVisible={true}
        onToggle={() => setShowLogs(!showLogs)}
      />
    </div>
  );
}
