'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const RandomGifEffect = () => {
  // Array des chemins vers les GIFs - vous pouvez en ajouter d'autres ici
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
  const MAX_GIFS = 5; // Nombre maximum de GIFs affichés simultanément

  // Types de mouvements aléatoires
  const getRandomMovement = () => {
    const movements = [
      'float', // Flotte doucement
      'spin', // Tourne
      'bounce', // Rebondit
      'diagonal', // Déplacement diagonal
      'wave', // Vague
      'zigzag', // Zigzag
    ];
    return movements[Math.floor(Math.random() * movements.length)];
  };

  // Génère une position aléatoire (10-90% pour éviter les bords)
  const getRandomPosition = () => ({
    left: Math.random() * 80 + 10,
    top: Math.random() * 80 + 10,
  });

  // Ajoute un nouveau GIF
  const addGif = () => {
    if (gifPaths.length === 0) return;

    // Vérifie si on a atteint la limite de GIFs
    setGifs((prevGifs) => {
      if (prevGifs.length >= MAX_GIFS) {
        return prevGifs; // Ne pas ajouter de nouveau GIF si on a atteint la limite
      }

      const randomGif = gifPaths[Math.floor(Math.random() * gifPaths.length)];
      const position = getRandomPosition();
      const movement = getRandomMovement();
      const size = 100 + Math.random() * 200; // 100-300px
      const lifetime = 3000 + Math.random() * 7000; // 3-10 secondes avant de disparaître
      const duration = lifetime / 1000; // Durée d'animation = durée de vie (en secondes pour CSS)
      const rotation = Math.random() * 360; // Rotation initiale aléatoire

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

      // Retire le GIF après sa durée de vie
      setTimeout(() => {
        setGifs((prevGifs) => prevGifs.filter((gif) => gif.id !== gifId));
      }, lifetime);

      return [...prevGifs, newGif];
    });
  };

  useEffect(() => {
    let currentTimer;

    // Ajoute des GIFs à des intervalles aléatoires
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
  }, []); // Array vide - s'exécute une seule fois

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

        /* Mouvement: Flotter */
        .gif-float {
          animation-name: fadeInOut, float;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* Mouvement: Tourner */
        .gif-spin {
          animation-name: fadeInOut, spin;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Mouvement: Rebondir */
        .gif-bounce {
          animation-name: fadeInOut, bounce;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-15px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-7px); }
        }

        /* Mouvement: Diagonal */
        .gif-diagonal {
          animation-name: fadeInOut, diagonal;
        }
        @keyframes diagonal {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 30px); }
        }

        /* Mouvement: Vague */
        .gif-wave {
          animation-name: fadeInOut, wave;
        }
        @keyframes wave {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(15px, -15px) rotate(5deg); }
          50% { transform: translate(0, -20px) rotate(0deg); }
          75% { transform: translate(-15px, -15px) rotate(-5deg); }
        }

        /* Mouvement: Zigzag */
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

