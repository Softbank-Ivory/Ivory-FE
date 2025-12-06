import { useState, useEffect, lazy, Suspense, type ElementType } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Lottie를 동적 import로 로드하여 코드 스플리팅
const Lottie = lazy(() => import('lottie-react').then(module => ({ default: module.default })));

interface LottieSceneProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  fallbackIcon?: ElementType;
}

export function LottieScene({ src, className, loop = true, autoplay = true, fallbackIcon: Icon }: LottieSceneProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation');
        return response.json();
      })
      .then((data) => {
        if (isMounted) {
          setAnimationData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded-3xl ${className}`}>
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/10 rounded-3xl p-4 text-center ${className}`}>
        {Icon ? (
          <Icon className="text-muted-foreground w-1/2 h-1/2" strokeWidth={1.5} />
        ) : (
          <>
            <AlertCircle className="text-red-400 mb-2" size={32} />
            <p className="text-xs text-red-500 font-medium">Failed to load</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" size={32} />}>
        <Lottie 
          animationData={animationData} 
          loop={loop} 
          autoplay={autoplay} 
          className="w-full h-full"
        />
      </Suspense>
    </div>
  );
}
