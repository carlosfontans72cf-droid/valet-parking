"use client";

export default function Logo({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo circular */}
      <circle cx="60" cy="60" r="58" fill="#1a2332" stroke="#F1C40F" strokeWidth="2" />
      
      {/* Auto */}
      <path d="M24 68c0-4.4 3.6-8 8-8h56c4.4 0 8 3.6 8 8v12H24V68z" fill="#3498DB" />
      <path d="M28 60l6-14c1-2.5 3.5-4 6-4h40c2.5 0 5 1.5 6 4l6 14H28z" fill="#2C3E50" />
      
      {/* Ventanas */}
      <path d="M44 46h14v8H44z" fill="#85C1E9" opacity="0.9" />
      <path d="M62 46h14v8H62z" fill="#85C1E9" opacity="0.9" />
      
      {/* Ruedas */}
      <circle cx="38" cy="80" r="7" fill="#2C3E50" />
      <circle cx="38" cy="80" r="3" fill="#95A5A6" />
      <circle cx="82" cy="80" r="7" fill="#2C3E50" />
      <circle cx="82" cy="80" r="3" fill="#95A5A6" />
      
      {/* Llave dorada */}
      <g transform="translate(68, 20) rotate(25)">
        <rect x="8" y="0" width="4" height="18" rx="2" fill="#F1C40F" />
        <circle cx="10" cy="5" r="5" fill="none" stroke="#F1C40F" strokeWidth="2" />
        <rect x="4" y="15" width="4" height="4" rx="1" fill="#F1C40F" />
        <rect x="12" y="15" width="4" height="4" rx="1" fill="#F1C40F" />
      </g>
      
      {/* Estrella */}
      <text x="90" y="28" fontSize="14" fill="#F1C40F">✦</text>
    </svg>
  );
}
