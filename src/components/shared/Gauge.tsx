import { motion } from 'framer-motion';

interface GaugeProps {
  value: number | null | undefined; // Allow null/undefined
  label: string;
}

export function Gauge({ value, label }: GaugeProps) {
  // Check if value is valid number
  const isValid = typeof value === 'number' && !isNaN(value);
  
  // Clamp value between 0 and 100 for arc rendering
  // If invalid, default to 0 for the arc (empty)
  const clampedValue = isValid ? Math.min(Math.max(value!, 0), 100) : 0;

  // Determine color based on value
  const getColor = (v: number | null | undefined) => {
    if (!isValid) return '#9CA3AF'; // Gray-400 for null/undefined
    if (v! < 33) return '#22C55E'; // Green-500
    if (v! < 66) return '#EAB308'; // Yellow-500
    return '#EF4444'; // Red-500
  };

  const color = getColor(value);
  
  // SVG Arc calculations
  const radius = 40;
  const strokeWidth = 10; // Slightly thicker
  // const center = 50; // Unused
  // Circumference of a semi-circle is PI * r
  const circumference = Math.PI * radius;
  // Dashoffset calculation
  const strokeDashoffset = circumference * (1 - clampedValue / 100);

  return (
    <div className="flex flex-col items-center justify-center w-full h-36 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4">
      <div className="relative w-full h-24 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 100 55" // Slightly taller than 50 to accommodate stroke cap
          className="h-full transform"
        >
          {/* Background Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E5E7EB" // Gray-200
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          />
        </svg>
        
        {/* Value Text */}
        <div className="absolute bottom-0 text-center translate-y-1">
            <span className={`text-3xl font-extrabold transition-colors duration-300`} style={{ color }}>
                {isValid ? clampedValue.toFixed(1) : '??'}
            </span>
            <span className="text-lg text-gray-400 font-bold ml-0.5">%</span>
        </div>
      </div>
      <div className="text-sm font-bold text-gray-600 mt-2 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
