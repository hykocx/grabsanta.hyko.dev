'use client';

import React, { useMemo } from 'react';

const SparkleEffect = () => {
  const colors = [
    'rgba(255, 50, 100, 0.15)',    // Rose vif
    'rgba(100, 150, 255, 0.15)',   // Bleu ciel
    'rgba(255, 200, 50, 0.15)',    // Or
    'rgba(150, 100, 255, 0.15)',   // Violet
    'rgba(50, 255, 200, 0.15)',    // Turquoise
    'rgba(255, 150, 50, 0.15)',    // Orange
    'rgba(255, 100, 200, 0.15)',   // Rose magenta
    'rgba(100, 255, 150, 0.15)',   // Vert menthe
    'rgba(200, 100, 255, 0.15)',   // Violet clair
    'rgba(255, 255, 100, 0.15)',   // Jaune citron
  ];

  const sparkles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const duration = 6 + Math.random() * 6; // 6-12s - beaucoup plus lent!
      const delay = Math.random() * 8; // 0-8s
      const size = 30 + Math.random() * 270; // 30-300px - grande variation!
      const blur = 15 + Math.random() * 40; // 15-55px de blur
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration,
        delay,
        size,
        blur,
        color,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-15">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="sparkle absolute"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animationDuration: `${sparkle.duration}s`,
            animationDelay: `${sparkle.delay}s`,
            filter: `blur(${sparkle.blur}px)`,
            background: `radial-gradient(circle, ${sparkle.color} 0%, transparent 70%)`,
          }}
        />
      ))}
      {/* Overlay vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 70%)'
        }}
      />
      <style jsx>{`
        .sparkle {
          border-radius: 50%;
          opacity: 0;
          animation: sparkle ease-in-out infinite;
          animation-fill-mode: backwards;
        }

        @keyframes sparkle {
          0% {
            opacity: 0;
            transform: scale(0.3) translate(-50%, -50%);
          }
          25% {
            opacity: 0.4;
            transform: scale(0.7) translate(-50%, -50%);
          }
          50% {
            opacity: 1;
            transform: scale(1) translate(-50%, -50%);
          }
          75% {
            opacity: 0.6;
            transform: scale(1.1) translate(-50%, -50%);
          }
          100% {
            opacity: 0;
            transform: scale(0.4) translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
};

export default SparkleEffect;

