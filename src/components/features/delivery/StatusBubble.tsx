import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExecutionStatus } from '@/types/api';
import { BUBBLE_POSITIONS, MAP_DIMENSIONS } from './constants';

const Lottie = lazy(() => import('lottie-react').then(module => ({ default: module.default })));

const ANIMATION_PATHS: Record<string, string> = {
    REQUEST_RECEIVED: '/animations/EmptyBox.json',
    CODE_FETCHING: '/animations/Warehouse&Delivery_01.json',
    SANDBOX_PREPARING: '/animations/Warehouse&Delivery_02.json',
    EXECUTING: '/animations/Warehouse&Delivery_03.json',
    COMPLETED: '/animations/Warehouse&Delivery_04.json',
    FAILED: '/animations/Failure.json'
};

interface StatusBubbleProps {
    status: ExecutionStatus;
    autoHide?: boolean;
}

export function StatusBubble({ status, autoHide = false }: StatusBubbleProps) {
    const [displayStatus, setDisplayStatus] = useState(status);
    const [isVisible, setIsVisible] = useState(true);

    const position = BUBBLE_POSITIONS[displayStatus] || BUBBLE_POSITIONS.REQUEST_RECEIVED;
    const animPath = ANIMATION_PATHS[displayStatus];
    const [animationData, setAnimationData] = useState<any>(null);

    // Handle status changes with a "Gap"
    useEffect(() => {
        if (status !== displayStatus) {
            // 1. Fade out current bubble
            setIsVisible(false);

            // 2. Wait for exit animation + 1s delay
            const timer = setTimeout(() => {
                setDisplayStatus(status); // Switch content/position
                setAnimationData(null); // Clear old animation to prevent flash
                setIsVisible(true);       // Fade in new bubble
            }, 1200); // 1.2s total wait (allows for exit anim + gap)

            return () => clearTimeout(timer);
        }
    }, [status, displayStatus]);

    useEffect(() => {
        const loadAnim = async () => {
             // Reset data immediately to ensure clean state
            setAnimationData(null);
            
            if (!animPath) return;

            try {
                const response = await fetch(animPath);
                const data = await response.json();
                setAnimationData(data);
            } catch (e) {
                console.error('Failed to load lottie', e);
            }
        };
        loadAnim();
    }, [animPath]);

    // User-friendly labels for each status
    const STATUS_LABELS: Record<string, string> = {
        REQUEST_RECEIVED: "Order Received",
        CODE_FETCHING: "Packing Items...",
        SANDBOX_PREPARING: "Loading Truck...",
        EXECUTING: "Delivering...",
        COMPLETED: "Arrived!",
        FAILED: "Delivery Failed"
    };

    if (!animationData) return null;

    return (
        <div 
            className="absolute z-40 pointer-events-none"
            style={{
                left: `${(position.x / MAP_DIMENSIONS.width) * 100}%`,
                top: `${(position.y / MAP_DIMENSIONS.height) * 100}%`,
                transform: 'translate(-50%, -100%)', // Anchor tail to coordinate
                marginTop: '-12px' // Lift slightly so tail tip touches point, not overlaps
            }}
        >
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        layout // Smoothly animate layout changes (position/size)
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 300, 
                            damping: 25,
                            layout: { duration: 0.3 } 
                        }}
                        className="w-64 h-48 relative" 
                    >
                        <div className="w-full h-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-4 relative flex flex-col items-center justify-center">
                             {/* Triangle pointer */}
                             <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-6 h-6 bg-white/95 border-b border-r border-white/50 transform rotate-45" />
        
                             {/* Content Crossfade */}
                             <AnimatePresence mode="wait">
                                 <motion.div
                                    key={displayStatus}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 w-full min-h-0 flex flex-col items-center justify-center"
                                 >
                                     <Suspense fallback={<div className="w-full h-full animate-pulse bg-gray-100 rounded-xl" />}>
                                    <div className="flex-1 w-full min-h-0">
                                            <Lottie 
                                                animationData={animationData}
                                                loop={false}
                                                onComplete={() => {
                                                    if (displayStatus === 'COMPLETED' || displayStatus === 'FAILED') {
                                                        setTimeout(() => setIsVisible(false), 1000);
                                                    } else if (autoHide) {
                                                        setIsVisible(false);
                                                    }
                                                }}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                     </Suspense>

                                     {/* Status Text */}
                                     <div className="mt-2 font-bold text-lg text-gray-700 tracking-tight text-center">
                                        {STATUS_LABELS[displayStatus] || displayStatus}
                                     </div>
                                 </motion.div>
                             </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
