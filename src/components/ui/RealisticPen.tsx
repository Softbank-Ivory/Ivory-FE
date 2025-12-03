export function RealisticPen({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(5px 5px 5px rgba(0,0,0,0.3))' }}
    >
      <defs>
        {/* Metallic Gradient for the tip */}
        <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#999" />
          <stop offset="50%" stopColor="#fff" />
          <stop offset="100%" stopColor="#999" />
        </linearGradient>

        {/* Blue Body Gradient */}
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#003366" />
          <stop offset="40%" stopColor="#0055aa" />
          <stop offset="60%" stopColor="#0055aa" />
          <stop offset="100%" stopColor="#002244" />
        </linearGradient>

        {/* Grip Gradient */}
        <linearGradient id="gripGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#4d4d4d" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
      </defs>

      {/* Pen Body */}
      <path d="M30,50 L70,50 L70,300 L30,300 Z" fill="url(#bodyGradient)" />
      
      {/* Pen Tip (Cone) */}
      <path d="M30,300 L50,380 L70,300 Z" fill="url(#metalGradient)" />
      
      {/* Ballpoint */}
      <circle cx="50" cy="380" r="2" fill="#333" />

      {/* Grip Section */}
      <rect x="30" y="220" width="40" height="80" fill="url(#gripGradient)" />
      
      {/* Grip Texture (Lines) */}
      <g stroke="#333" strokeWidth="1">
        <line x1="30" y1="230" x2="70" y2="230" />
        <line x1="30" y1="240" x2="70" y2="240" />
        <line x1="30" y1="250" x2="70" y2="250" />
        <line x1="30" y1="260" x2="70" y2="260" />
        <line x1="30" y1="270" x2="70" y2="270" />
        <line x1="30" y1="280" x2="70" y2="280" />
        <line x1="30" y1="290" x2="70" y2="290" />
      </g>

      {/* Top Cap */}
      <path d="M30,50 L30,20 C30,10 70,10 70,20 L70,50 Z" fill="url(#bodyGradient)" />
      
      {/* Clip */}
      <path d="M60,30 L65,30 L65,150 L60,140 Z" fill="#ccc" stroke="#999" strokeWidth="1" />
      <rect x="60" y="30" width="5" height="10" fill="#999" />

      {/* Shine/Reflection */}
      <path d="M45,20 L45,300" stroke="white" strokeWidth="2" strokeOpacity="0.3" fill="none" />
    </svg>
  );
}
