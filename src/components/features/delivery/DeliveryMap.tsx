
export function DeliveryMap() {
  // Longer path spanning from bottom-center to left-middle
  // Modified from Streetmap_01_bright.svg Line 9 to be visible within viewbox
  const routePath = "M511 1200 L520.304 397.084 C520.74 359.756 507.334 323.59 482.672 295.565 L468.259 279.187 L343.222 399.524 C320.88 421.026 292.46 435.128 261.824 439.915 L219.051 446.598 C202.378 449.204 186.26 454.585 171.367 462.519 L93.2125 504.152";

  return (
    <div className="relative w-full h-full bg-[#F0F0F0] overflow-hidden rounded-xl border-4 border-white shadow-2xl group">
      {/* Map Header/Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Live Tracking</span>
        </div>
      </div>

      {/* Container for Map and Overlay */}
      <div className="relative w-full h-full flex items-center justify-center bg-[#F0F0F0]">
        {/* Background Map Image */}
        <img
          src="/svg/Streetmap_01_bright.svg"
          alt="Delivery Map"
          className="w-full h-full object-contain"
        />

        {/* Overlay SVG for Route */}
        <svg
          viewBox="0 0 1212 1325"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          {/* The Route Line (Dashed) */}
          <path
            d={routePath}
            stroke="#ef4444"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="20 20"
            fill="none"
            opacity="0.8"
          />

          {/* Start Point */}
          <circle cx="511" cy="1200" r="16" fill="#22c55e" stroke="white" strokeWidth="6" />

          {/* End Point */}
          <circle cx="93.2125" cy="504.152" r="16" fill="#ef4444" stroke="white" strokeWidth="6" />

          {/* Moving Red Dot */}
          <circle r="12" fill="#ef4444" stroke="white" strokeWidth="4">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={routePath}
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        </svg>
      </div>
    </div>
  );
}
