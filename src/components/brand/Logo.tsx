export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dylan’s Detailing logo"
      role="img"
    >
      <defs>
        <linearGradient id="g" x1="6" y1="6" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16a34a" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* soft rounded square */}
      <rect x="3" y="3" width="38" height="38" rx="14" fill="url(#g)" filter="url(#s)" />

      {/* minimalist "DD" monogram */}
      <path
        d="M14.3 29.5V14.6h5.9c3.8 0 6.2 2.2 6.2 7.4s-2.4 7.5-6.2 7.5h-5.9Zm3.2-2.7h2.6c1.9 0 3.1-1.2 3.1-4.8 0-3.5-1.2-4.7-3.1-4.7h-2.6v9.5Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M27.6 29.5V14.6h5.2c3.1 0 5 1.6 5 4.4 0 2-1 3.3-2.9 3.9l3.3 6.6h-3.5l-2.9-6h-1.1v6h-3.1Zm3.1-8.6h1.8c1.3 0 2.1-.6 2.1-1.8 0-1.2-.8-1.8-2.1-1.8h-1.8v3.6Z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  );
}
