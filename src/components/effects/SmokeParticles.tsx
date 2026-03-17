import { useEffect } from 'react';

/** Smoke particle effects — renders behind content with absolute positioning */
export function SmokeParticles({ count = 6, className = '' }: { count?: number; className?: string }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 20 + Math.random() * 40,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 4,
    slow: Math.random() > 0.5,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={p.slow ? 'smoke-particle-slow' : 'smoke-particle'}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: '10%',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
