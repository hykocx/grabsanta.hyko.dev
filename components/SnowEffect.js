'use client';

import React, { useMemo } from 'react';

const SnowEffect = () => {
  // Generate snowflakes immediately with useMemo instead of useEffect
  const snowflakes = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const duration = 10 + Math.random() * 20; // 10-30s
      return {
        id: i,
        left: Math.random() * 100,
        animationDuration: duration,
        // Negative delay to start animation mid-way, creating pre-existing snow
        animationDelay: -Math.random() * duration, // Random negative delay up to full duration
        size: 2 + Math.random() * 4, // 2-6px
        opacity: 0.3 + Math.random() * 0.7, // 0.3-1
        swingDuration: 3 + Math.random() * 4, // 3-7s
        swingDelay: -Math.random() * 7, // Negative delay for swing too
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10 animate-fadeIn">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake-container absolute"
          style={{
            left: `${flake.left}%`,
            top: '-10vh',
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
          }}
        >
          <div
            className="snowflake"
            style={{
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
              animationDuration: `${flake.swingDuration}s`,
              animationDelay: `${flake.swingDelay}s`,
            }}
          />
        </div>
      ))}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 1.5s ease-in;
        }

        .snowflake-container {
          animation: fall linear infinite;
        }

        .snowflake {
          background: white;
          border-radius: 50%;
          animation: swing ease-in-out infinite;
          filter: blur(1px);
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes fall {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(120vh);
          }
        }

        @keyframes swing {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(30px);
          }
        }
      `}</style>
    </div>
  );
};

export default SnowEffect;

