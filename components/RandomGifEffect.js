'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const RandomGifEffect = () => {
  // Array of paths to GIFs - you can add more here
  const gifPaths = [
    '/assets/blSTtZehjAZ8I.gif',
    '/assets/3EfgWHj0YIDrW.webp',
    '/assets/l4pTfx2qLszoacZRS.gif',
    '/assets/imbTfdz5TWSsw.webp',
    '/assets/9w475hDWEPVlu.gif',
    '/assets/vMFo6SUzZO5gI.gif',
    '/assets/3NtY188QaxDdC.gif',
    '/assets/31lPv5L3aIvTi.webp',
    '/assets/90F8aUepslB84.webp',
    '/assets/fUQ4rhUZJYiQsas6WD.gif',
    '/assets/KlaNA4Rad01k3rlIBR.gif',
    '/assets/yNvPaHz8LI4I4jKKws.webp',
  ];

  const [gifs, setGifs] = useState([]);
  const nextIdRef = useRef(0);
  const MAX_GIFS = 5; // Maximum number of GIFs displayed simultaneously

  // Types of random movements
  const getRandomMovement = () => {
    const movements = [
      'float', // Floats gently
      'spin', // Spins
      'bounce', // Bounces
      'diagonal', // Diagonal movement
      'wave', // Wave
      'zigzag', // Zigzag
    ];
    return movements[Math.floor(Math.random() * movements.length)];
  };

  // Generate a random position (10-90% to avoid edges)
  const getRandomPosition = () => ({
    left: Math.random() * 80 + 10,
    top: Math.random() * 80 + 10,
  });

  // Add a new GIF
  const addGif = () => {
    if (gifPaths.length === 0) return;

    // Check if we've reached the GIF limit
    setGifs((prevGifs) => {
      if (prevGifs.length >= MAX_GIFS) {
        return prevGifs; // Don't add a new GIF if we've reached the limit
      }

      const randomGif = gifPaths[Math.floor(Math.random() * gifPaths.length)];
      const position = getRandomPosition();
      const movement = getRandomMovement();
      const size = 100 + Math.random() * 200; // 100-300px
      const lifetime = 3000 + Math.random() * 7000; // 3-10 seconds before disappearing
      const duration = lifetime / 1000; // Animation duration = lifetime (in seconds for CSS)
      const rotation = Math.random() * 360; // Random initial rotation

      const gifId = nextIdRef.current;
      nextIdRef.current += 1;

      const newGif = {
        id: gifId,
        src: randomGif,
        left: position.left,
        top: position.top,
        size,
        movement,
        duration,
        rotation,
      };

      // Remove GIF after its lifetime
      setTimeout(() => {
        setGifs((prevGifs) => prevGifs.filter((gif) => gif.id !== gifId));
      }, lifetime);

      return [...prevGifs, newGif];
    });
  };

  useEffect(() => {
    let currentTimer;

    // Add GIFs at random intervals
    const scheduleNextGif = () => {
      const delay = 2000 + Math.random() * 4000; // 2-6 secondes
      currentTimer = setTimeout(() => {
        addGif();
        scheduleNextGif();
      }, delay);
    };

    scheduleNextGif();

    return () => {
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
    };
  }, []); // Empty array - runs only once

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-30">
      {gifs.map((gif) => (
        <div
          key={gif.id}
          className={`absolute gif-container gif-${gif.movement}`}
          style={{
            left: `${gif.left}%`,
            top: `${gif.top}%`,
            width: `${gif.size}px`,
            height: `${gif.size}px`,
            animationDuration: `${gif.duration}s`,
            transform: `rotate(${gif.rotation}deg)`,
          }}
        >
          <Image
            src={gif.src}
            alt="Party GIF"
            width={gif.size}
            height={gif.size}
            className="w-full h-full object-contain drop-shadow-2xl"
            unoptimized // Important pour les GIFs animés
          />
        </div>
      ))}
      
      <style jsx>{`
        .gif-container {
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          opacity: 0;
          animation-name: fadeInOut, movement;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.5); }
          10% { opacity: 1; transform: scale(1); }
          90% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5); }
        }

        /* Movement: Float */
        .gif-float {
          animation-name: fadeInOut, float;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* Movement: Spin */
        .gif-spin {
          animation-name: fadeInOut, spin;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Movement: Bounce */
        .gif-bounce {
          animation-name: fadeInOut, bounce;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-15px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-7px); }
        }

        /* Movement: Diagonal */
        .gif-diagonal {
          animation-name: fadeInOut, diagonal;
        }
        @keyframes diagonal {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 30px); }
        }

        /* Movement: Wave */
        .gif-wave {
          animation-name: fadeInOut, wave;
        }
        @keyframes wave {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(15px, -15px) rotate(5deg); }
          50% { transform: translate(0, -20px) rotate(0deg); }
          75% { transform: translate(-15px, -15px) rotate(-5deg); }
        }

        /* Movement: Zigzag */
        .gif-zigzag {
          animation-name: fadeInOut, zigzag;
        }
        @keyframes zigzag {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(20px); }
          75% { transform: translateX(-20px); }
        }
      `}</style>
    </div>
  );
};

export default RandomGifEffect;

