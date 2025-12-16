export function DDSLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DDS logo"
      role="img"
    >
      <defs>
        <linearGradient id="ddsG" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <filter id="ddsGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* outer frame */}
      <rect x="6" y="6" width="36" height="36" rx="14" fill="rgba(255,255,255,0.03)" />
      <rect
        x="6.5"
        y="6.5"
        width="35"
        height="35"
        rx="13.5"
        stroke="url(#ddsG)"
        strokeOpacity="0.9"
        filter="url(#ddsGlow)"
      />

      {/* DDS text (futuristic) */}
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        letterSpacing="2"
        fill="url(#ddsG)"
        style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}
      >
        DDS
      </text>

      {/* tiny “spark” accent */}
      <path
        d="M34.2 16.2l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2 1.2-2.6z"
        fill="rgba(255,255,255,0.85)"
      />
    </svg>
  );
}

export function DDSWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="text-sm font-extrabold tracking-tight leading-tight">
        Dylan’s Detailing Service
      </div>
      <div className="text-xs text-muted leading-tight">Wellington · Mobile detailing</div>
    </div>
  );
}
