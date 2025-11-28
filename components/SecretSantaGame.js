'use client';

import React, { useState, useEffect, useRef } from 'react';

const SecretSantaGame = () => {
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 85 });
  const [isRunningAway, setIsRunningAway] = useState(false);
  const [clicks, setClicks] = useState([]);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementText, setEncouragementText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [badEmojis, setBadEmojis] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  // High score system states
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState([]);
  const [dailyWinners, setDailyWinners] = useState([]);
  const [isTopScore, setIsTopScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [newScoreId, setNewScoreId] = useState(null);
  const [leaderboardMode, setLeaderboardMode] = useState('today'); // 'today' or 'daily-winners'
  const [viewOnlyMode, setViewOnlyMode] = useState(false); // For viewing leaderboard without playing
  const [playerRank, setPlayerRank] = useState(null); // Player's position in the leaderboard
  const nextClickIdRef = useRef(0);
  const nextBadEmojiIdRef = useRef(0);
  const moveIntervalRef = useRef(null);
  const encouragementTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const hintIntervalRef = useRef(null);
  const badEmojiIntervalRef = useRef(null);

  const encouragements = [
    "🎉 Wow! Fast!",
    "🎄 Incredible!",
    "⭐ Super!",
    "🎁 Great!",
    "❄️ Fantastic!",
    "🎅 Ho ho ho!",
    "✨ Well done!",
    "🔥 On fire!",
    "💪 Champion!",
    "🎊 Excellent!"
  ];

  const badEmojiList = ['👻', '🙀', '🙊', '🐧', '🍎', '🍒', '🍿'];
  
  const badMessages = [
    "😱 Oh no!",
    "💥 Missed!",
    "😵 Ouch!",
    "🙈 Too bad!",
    "⚠️ Watch out!",
    "❌ Oops!"
  ];

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || (window.innerWidth <= 768);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Move Santa to a new random position
  const moveSanta = () => {
    const newX = Math.random() * 85 + 5; // 5-90%
    const newY = Math.random() * 85 + 5; // 5-90%
    setPosition({ x: newX, y: newY });
    setIsRunningAway(true);
    setTimeout(() => setIsRunningAway(false), 500);
  };

  // Fetch high scores at component mount (to show during game)
  useEffect(() => {
    fetchHighScores(false); // Don't show screens, just load the scores
    fetchDailyWinners(); // Load daily winners for display
  }, []);

  // Fetch high scores when game is over
  useEffect(() => {
    if (gameOver) {
      fetchHighScores(true); // Show name entry or leaderboard screens
      fetchDailyWinners(); // Refresh daily winners
    }
  }, [gameOver]);

  // Fetch today's high scores from API
  const fetchHighScores = async (showScreens = true) => {
    try {
      const response = await fetch('/api/scores?mode=today');
      const data = await response.json();
      
      if (data.success) {
        setHighScores(data.scores);
        
        // Only show screens if requested (i.e., when game is over)
        if (showScreens) {
          // Check if current score qualifies for top 10
          const qualifies = data.scores.length < 10 || score > (data.scores[data.scores.length - 1]?.score || 0);
          setIsTopScore(qualifies);
          
          if (qualifies) {
            // Calculate player's rank (position where their score would be inserted)
            let rank = 1;
            for (let i = 0; i < data.scores.length; i++) {
              if (score > data.scores[i].score) {
                break;
              }
              rank++;
            }
            setPlayerRank(rank);
            
            // Show name entry screen
            setShowNameEntry(true);
          } else {
            // Show leaderboard directly
            setShowLeaderboard(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching high scores:', error);
      // Still show the game over screen even if scores fail to load
      if (showScreens) {
        setShowLeaderboard(true);
      }
    }
  };

  // Fetch daily winners from API
  const fetchDailyWinners = async () => {
    try {
      const response = await fetch('/api/scores?mode=daily-winners');
      const data = await response.json();
      
      if (data.success) {
        setDailyWinners(data.dailyWinners || []);
      }
    } catch (error) {
      console.error('Error fetching daily winners:', error);
    }
  };

  // Save high score to database
  const saveHighScore = async () => {
    if (playerName.trim().length === 0) {
      return;
    }

    setIsSavingScore(true);
    
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName,
          score: score,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewScoreId(data.score.id);
        // Refresh the leaderboard with the new score
        await fetchHighScores(false); // Just refresh the scores list
        setShowNameEntry(false);
        setShowLeaderboard(true);
      } else {
        console.error('Failed to save score:', data.error);
      }
    } catch (error) {
      console.error('Error saving high score:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  // Handle name input (arcade style - uppercase letters only)
  const handleNameInput = (e) => {
    const value = e.target.value.toUpperCase().slice(0, 10);
    setPlayerName(value);
  };

  // Handle keyboard input for name entry
  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter' && playerName.trim().length > 0) {
      saveHighScore();
    }
  };

  // Skip saving score
  const skipSaveScore = () => {
    setShowNameEntry(false);
    setShowLeaderboard(true);
  };

  // Start the timer
  useEffect(() => {
    if (gameStarted && !gameOver) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setGameOver(true);
            setIsActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameStarted, gameOver]);

  // Start automatic Santa movement (only when game has started)
  useEffect(() => {
    if (isActive && gameStarted) {
      // Santa moves much more often on mobile to increase difficulty
      const scheduleNextMove = () => {
        const delay = isMobile 
          ? 400 + Math.random() * 1500  // Mobile: 0.8-2 seconds (very fast and frequent!)
          : 2500 + Math.random() * 2500; // Desktop: 2.5-5 seconds (slower)
        moveIntervalRef.current = setTimeout(() => {
          moveSanta();
          scheduleNextMove();
        }, delay);
      };
      scheduleNextMove();
    }

    return () => {
      if (moveIntervalRef.current) {
        clearTimeout(moveIntervalRef.current);
      }
    };
  }, [isActive, gameStarted, isMobile]);

  // Periodically display "Catch me" before game starts
  useEffect(() => {
    if (!gameStarted && !gameOver) {
      const showHintMessage = () => {
        setShowHint(true);
        setTimeout(() => {
          setShowHint(false);
        }, 2000); // Message stays visible for 2 seconds
      };

      // Display message immediately at start
      const initialTimeout = setTimeout(showHintMessage, 1000);

      // Then redisplay every 12 seconds
      hintIntervalRef.current = setInterval(showHintMessage, 12000);

      return () => {
        clearTimeout(initialTimeout);
        if (hintIntervalRef.current) {
          clearInterval(hintIntervalRef.current);
        }
      };
    }
  }, [gameStarted, gameOver]);

  // Generate bad emojis during the game
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const spawnBadEmoji = () => {
        const newBadEmoji = {
          id: nextBadEmojiIdRef.current,
          emoji: badEmojiList[Math.floor(Math.random() * badEmojiList.length)],
          x: Math.random() * 85 + 5,
          y: Math.random() * 85 + 5,
        };
        nextBadEmojiIdRef.current += 1;
        
        setBadEmojis((prev) => [...prev, newBadEmoji]);
        
        // Remove bad emoji after 2-3 seconds if it hasn't been clicked
        setTimeout(() => {
          setBadEmojis((prev) => prev.filter((emoji) => emoji.id !== newBadEmoji.id));
        }, 2000 + Math.random() * 1000);
      };

      // First bad emoji after 3 seconds
      const initialTimeout = setTimeout(spawnBadEmoji, 3000);
      
      // Negative emojis appear more often on mobile to add difficulty
      const scheduleNextBadEmoji = () => {
        const delay = isMobile
          ? 2500 + Math.random() * 2500  // Mobile: 2.5-5 seconds (more frequent)
          : 3000 + Math.random() * 3000; // Desktop: 3-6 seconds
        badEmojiIntervalRef.current = setTimeout(() => {
          spawnBadEmoji();
          scheduleNextBadEmoji();
        }, delay);
      };
      
      scheduleNextBadEmoji();

      return () => {
        clearTimeout(initialTimeout);
        if (badEmojiIntervalRef.current) {
          clearTimeout(badEmojiIntervalRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, isMobile]);

  // Handle click on Santa
  const handleClick = (e) => {
    e.stopPropagation();
    
    if (gameOver) return;

    // Start game on first click
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    // Increase score
    setScore((prevScore) => prevScore + 1);

    // Display encouragement message
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    setEncouragementText(randomEncouragement);
    setShowEncouragement(true);
    
    if (encouragementTimeoutRef.current) {
      clearTimeout(encouragementTimeoutRef.current);
    }
    encouragementTimeoutRef.current = setTimeout(() => {
      setShowEncouragement(false);
    }, 1000);

    // Add visual effect to click
    const clickId = nextClickIdRef.current;
    nextClickIdRef.current += 1;
    
    const clickEffect = {
      id: clickId,
      x: e.clientX,
      y: e.clientY,
    };
    
    setClicks((prevClicks) => [...prevClicks, clickEffect]);
    
    // Remove effect after animation
    setTimeout(() => {
      setClicks((prevClicks) => prevClicks.filter((click) => click.id !== clickId));
    }, 1000);

    // Santa runs away immediately!
    moveSanta();
  };

  // Handle click on bad emoji
  const handleBadEmojiClick = (e, badEmojiId) => {
    e.stopPropagation();
    
    if (gameOver) return;

    // Remove bad emoji
    setBadEmojis((prev) => prev.filter((emoji) => emoji.id !== badEmojiId));

    // Lose a point (but don't go below 0)
    setScore((prevScore) => Math.max(0, prevScore - 1));

    // Display negative message
    const randomBadMessage = badMessages[Math.floor(Math.random() * badMessages.length)];
    setEncouragementText(randomBadMessage);
    setShowEncouragement(true);
    
    if (encouragementTimeoutRef.current) {
      clearTimeout(encouragementTimeoutRef.current);
    }
    encouragementTimeoutRef.current = setTimeout(() => {
      setShowEncouragement(false);
    }, 1000);

    // Add visual effect to click (negative)
    const clickId = nextClickIdRef.current;
    nextClickIdRef.current += 1;
    
    const clickEffect = {
      id: clickId,
      x: e.clientX,
      y: e.clientY,
      isNegative: true,
    };
    
    setClicks((prevClicks) => [...prevClicks, clickEffect]);
    
    // Remove effect after animation
    setTimeout(() => {
      setClicks((prevClicks) => prevClicks.filter((click) => click.id !== clickId));
    }, 1000);
  };

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (encouragementTimeoutRef.current) {
        clearTimeout(encouragementTimeoutRef.current);
      }
    };
  }, []);

  // Function to restart the game
  const restartGame = () => {
    setScore(0);
    setGameStarted(false);
    setTimeLeft(30);
    setGameOver(false);
    setIsActive(true);
    setPosition({ x: 50, y: 85 });
    setBadEmojis([]);
    setShowNameEntry(false);
    setShowLeaderboard(false);
    setPlayerName('');
    setIsTopScore(false);
    setNewScoreId(null);
    setLeaderboardMode('today');
    setViewOnlyMode(false);
    setPlayerRank(null);
  };

  // Function to view leaderboard without playing
  const viewLeaderboard = () => {
    setViewOnlyMode(true);
    setShowLeaderboard(true);
    fetchHighScores(false);
    fetchDailyWinners();
  };

  // Function to close view-only leaderboard
  const closeLeaderboard = () => {
    setShowLeaderboard(false);
    setViewOnlyMode(false);
  };

  if (!isActive && !gameOver) return null;

  return (
    <>
      <div className='fixed top-0 z-40 flex items-center justify-center gap-2 w-full p-4'>
        {/* Timer Display */}
        {gameStarted && !gameOver && (
          <div className={`px-2 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg font-bold text-sm sm:text-lg border-2 ${
            timeLeft <= 10 ? 'bg-red-600 animate-pulse border-red-600' : 'bg-green-600 border-green-600'
          } text-white`}>
            ⏱️ {timeLeft}s
          </div>
        )}

        {/* Score Display - Only shown when game has started */}
        {gameStarted && (
          <div className="bg-black text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg font-bold text-sm sm:text-lg border-2 border-white">
            🎅 <span className="hidden xs:inline">Score: </span>{score}
          </div>
        )}

        {/* High Score Display - Shows today's best score during the game */}
        {gameStarted && !gameOver && highScores.length > 0 && (
          <div className="text-yellow-500 px-2 py-1 sm:px-4 sm:py-2 rounded-full font-bold text-sm sm:text-lg border-2 border-yellow-500">
            🏆 {highScores[0].score}
          </div>
        )}
      </div>

      {/* Encouragement Text */}
      {showEncouragement && !gameOver && (
        <div className="fixed top-18 sm:top-22 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-400 text-red-600 px-3 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg font-bold text-base sm:text-xl animate-bounce">
          {encouragementText}
        </div>
      )}

      {/* Name Entry Screen (Arcade Style) */}
      {gameOver && showNameEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4">
          <div className="bg-black border-2 border-yellow-400 p-3 sm:p-5 rounded-lg text-center max-w-xl w-full transform animate-gameOverBounce font-mono">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 animate-pulse">
              {playerRank === 1 ? '👑' : playerRank === 2 ? '🥈' : playerRank === 3 ? '🥉' : '🏆'}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-2 sm:mb-3 tracking-wider">
              {playerRank === 1 && 'HIGH SCORE!'}
              {playerRank === 2 && 'ALMOST #1!'}
              {playerRank === 3 && '3RD PLACE!'}
              {playerRank > 3 && 'TOP 10!'}
            </h2>
            {playerRank && (
              <p className="text-sm sm:text-base text-green-400 mb-2 tracking-wide">
                {playerRank === 1 && '★ NEW DAILY RECORD ★'}
                {playerRank === 2 && '★ 2ND BEST SCORE ★'}
                {playerRank === 3 && '★ 3RD BEST SCORE ★'}
                {playerRank > 3 && `★ ${playerRank}TH PLACE ★`}
              </p>
            )}
            <div className="bg-neutral-900 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-yellow-600">
              <p className="text-base sm:text-lg text-yellow-400 mb-2">SCORE: {score}</p>
              <p className="text-sm sm:text-base text-green-400 mb-2 sm:mb-3">ENTER YOUR NAME</p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-2 sm:mb-3">
                <input
                  type="text"
                  value={playerName}
                  onChange={handleNameInput}
                  onKeyPress={handleNameKeyPress}
                  maxLength={10}
                  placeholder="PLAYER"
                  autoFocus
                  className="bg-black border-2 border-green-500 text-green-400 text-lg sm:text-xl font-bold text-center px-3 py-2 rounded tracking-widest uppercase focus:outline-none focus:border-yellow-400 animate-blink-cursor w-full sm:w-auto"
                  style={{ fontFamily: 'monospace' }}
                />
                <span className="text-green-500 text-sm sm:text-base">{playerName.length}/10</span>
              </div>
              
              <p className="text-xs text-gray-500 mb-2">Use A-Z, spaces allowed</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button
                onClick={saveHighScore}
                disabled={playerName.trim().length === 0 || isSavingScore}
                className="cursor-pointer bg-green-600 text-white font-bold px-4 sm:px-6 py-2 rounded border-2 border-green-400 hover:bg-green-500 hover:scale-105 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSavingScore ? 'SAVING...' : '✓ SAVE'}
              </button>
              <button
                onClick={skipSaveScore}
                className="cursor-pointer bg-gray-700 text-white font-bold px-4 sm:px-6 py-2 rounded border-2 border-gray-500 hover:bg-gray-600 hover:scale-105 transition-all text-sm sm:text-base"
              >
                ✕ SKIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Screen */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-black border-2 border-yellow-400 p-3 sm:p-5 rounded-lg text-center max-w-2xl w-full transform animate-gameOverBounce font-mono my-2">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 animate-spin-slow">🎅</div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-2 sm:mb-3 tracking-wider">LEADERBOARD</h2>
            
            {gameOver && !viewOnlyMode && (
              <div className="bg-neutral-950/90 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-neutral-800">
                <p className="text-sm sm:text-base text-gray-300 mb-1">Your Score:</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">{score}</p>
                <div className="mt-1 sm:mt-2">
                  {score === 0 && <p className="text-gray-300 text-xs sm:text-sm">🎄 Try again!</p>}
                  {score > 0 && score <= 5 && <p className="text-gray-300 text-xs sm:text-sm">🎁 Not bad! Keep going!</p>}
                  {score > 5 && score <= 10 && <p className="text-gray-300 text-xs sm:text-sm">⭐ Well played!</p>}
                  {score > 10 && score <= 15 && <p className="text-yellow-400 text-xs sm:text-sm">🎉 Great score!</p>}
                  {score > 15 && score <= 20 && <p className="text-yellow-400 text-xs sm:text-sm">🔥 Incredible!</p>}
                  {score > 20 && <p className="text-yellow-400 text-sm sm:text-base font-bold">👑 CHAMPION! You're a pro!</p>}
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex justify-center gap-2 mb-2 sm:mb-3">
              <button
                onClick={() => setLeaderboardMode('today')}
                className={`cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                  leaderboardMode === 'today'
                    ? 'bg-green-600 text-white border-2 border-green-400'
                    : 'bg-neutral-800 text-gray-400 border-2 border-neutral-600 hover:bg-neutral-700'
                }`}
              >
                🎯 TODAY
              </button>
              <button
                onClick={() => setLeaderboardMode('daily-winners')}
                className={`cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                  leaderboardMode === 'daily-winners'
                    ? 'bg-yellow-600 text-white border-2 border-yellow-400'
                    : 'bg-neutral-800 text-gray-400 border-2 border-neutral-600 hover:bg-neutral-700'
                }`}
              >
                🏆 CHAMPIONS
              </button>
            </div>

            {/* Today's High Scores Table */}
            {leaderboardMode === 'today' && highScores.length > 0 && (
              <div className="bg-neutral-900 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-green-600">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-green-400 mb-2 tracking-wider">TODAY'S TOP 10</h3>
                <div className="overflow-y-auto max-h-48 sm:max-h-56">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-green-400 border-b-2 border-green-600">
                        <th className="py-1 px-1 sm:px-2 text-center text-xs sm:text-sm">RANK</th>
                        <th className="py-1 px-1 sm:px-2 text-xs sm:text-sm">NAME</th>
                        <th className="py-1 px-1 sm:px-2 text-right text-xs sm:text-sm">SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highScores.map((highScore, index) => (
                        <tr
                          key={highScore.id}
                          className={`border-b border-neutral-800 ${
                            highScore.id === newScoreId
                              ? 'bg-yellow-900/40 text-yellow-300 animate-pulse'
                              : 'text-green-300'
                          }`}
                        >
                          <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-center text-sm sm:text-base font-bold">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && (index + 1)}
                          </td>
                          <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm font-bold tracking-wider truncate max-w-[100px] sm:max-w-none">
                            {highScore.name}
                          </td>
                          <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-xs sm:text-sm font-bold">
                            {highScore.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily Winners Table */}
            {leaderboardMode === 'daily-winners' && (
              <div className="bg-neutral-900 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-yellow-600">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-yellow-400 mb-2 tracking-wider">DAILY CHAMPIONS</h3>
                {dailyWinners.length > 0 ? (
                  <div className="overflow-y-auto max-h-48 sm:max-h-56">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-yellow-400 border-b-2 border-yellow-600">
                          <th className="py-1 px-1 sm:px-2 text-xs sm:text-sm">DATE</th>
                          <th className="py-1 px-1 sm:px-2 text-xs sm:text-sm">NAME</th>
                          <th className="py-1 px-1 sm:px-2 text-right text-xs sm:text-sm">SCORE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyWinners.map((winner, index) => {
                          // Parse the date correctly to avoid timezone issues
                          // Extract just the date part if it's a timestamp
                          const dateStr = typeof winner.game_date === 'string' 
                            ? winner.game_date.split('T')[0] 
                            : winner.game_date;
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          const today = new Date();
                          const isToday = date.getDate() === today.getDate() && 
                                         date.getMonth() === today.getMonth() && 
                                         date.getFullYear() === today.getFullYear();
                          const formattedDate = date.toLocaleDateString('en-US', { 
                            day: '2-digit', 
                            month: '2-digit'
                          });
                          
                          return (
                            <tr
                              key={`${winner.game_date}-${winner.id}`}
                              className={`border-b border-neutral-800 ${
                                isToday
                                  ? 'bg-green-900/40 text-green-300'
                                  : 'text-yellow-300'
                              }`}
                            >
                              <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm font-bold">
                                {isToday ? '🎯 ' : ''}{formattedDate}
                              </td>
                              <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm font-bold tracking-wider truncate max-w-[100px] sm:max-w-none">
                                {index === 0 && isToday ? '👑 ' : ''}{winner.name}
                              </td>
                              <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-xs sm:text-sm font-bold">
                                {winner.score}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs sm:text-sm py-2">No champions yet!</p>
                )}
              </div>
            )}

            <button
              onClick={viewOnlyMode ? closeLeaderboard : restartGame}
              className="cursor-pointer bg-white text-black font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-lg border-2 border-yellow-400 hover:bg-yellow-400 hover:scale-110 transition-all text-sm sm:text-base"
            >
              {viewOnlyMode ? 'CLOSE' : 'BACK'}
            </button>
          </div>
        </div>
      )}

      {/* Subtle View Leaderboard Button - Only when not playing */}
      {!gameStarted && !gameOver && !showLeaderboard && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={viewLeaderboard}
            className="cursor-pointer bg-black/60 hover:bg-black/80 text-yellow-400 border border-yellow-400/50 hover:border-yellow-400 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all hover:scale-105 backdrop-blur-sm"
          >
            🏆 Leaderboard
          </button>
        </div>
      )}

      {/* Click Effects */}
      {clicks.map((click) => (
        <div
          key={click.id}
          className="fixed pointer-events-none z-40"
          style={{
            left: `${click.x}px`,
            top: `${click.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className={`text-2xl sm:text-3xl font-bold animate-clickEffect ${
            click.isNegative ? 'text-red-500' : 'text-yellow-400'
          }`}>
            {click.isNegative ? '-1' : '+1'}
          </div>
        </div>
      ))}

      {/* Santa Claus */}
      {!gameOver && (
        <div
          className={`fixed cursor-pointer z-50 transition-all hover:scale-110`}
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
            transitionDuration: isMobile 
              ? (isRunningAway ? '100ms' : '100ms')  // Very fast on mobile - almost instant
              : (isRunningAway ? '500ms' : '300ms') // Normal on desktop
          }}
          onClick={handleClick}
        >
          <div className={`relative ${gameStarted ? 'animate-santa-wiggle' : ''}`}>
            <div className="text-5xl sm:text-6xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:drop-shadow-[0_0_20px_rgba(255,215,0,1)] transition-all">
              🎅
            </div>
            {/* Periodic message before game starts */}
            {!gameStarted && showHint && (
              <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 bg-white text-red-600 px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap shadow-lg animate-bounce">
                Catch me! 👆
              </div>
            )}
            {/* Small hover message - more subtle */}
            {gameStarted && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-red-600 px-2 py-1 rounded text-xs font-bold whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                Catch me! 🎁
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bad Emojis */}
      {!gameOver && badEmojis.map((badEmoji) => (
        <div
          key={badEmoji.id}
          className="fixed cursor-pointer z-40 transition-all duration-300 hover:scale-110"
          style={{
            left: `${badEmoji.x}%`,
            top: `${badEmoji.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => handleBadEmojiClick(e, badEmoji.id)}
        >
          <div className="relative animate-bad-pulse">
            <div className="text-4xl sm:text-5xl drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] hover:drop-shadow-[0_0_20px_rgba(255,0,0,1)] transition-all">
              {badEmoji.emoji}
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
              Avoid me! ⚠️
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes clickEffect {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.5);
          }
        }

        .animate-clickEffect {
          animation: clickEffect 1s ease-out forwards;
        }

        @keyframes santa-wiggle {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }

        .animate-santa-wiggle {
          animation: santa-wiggle 0.5s ease-in-out infinite;
        }

        @keyframes gameOverBounce {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(-50px);
          }
          60% {
            opacity: 1;
            transform: scale(1.1) translateY(0);
          }
          80% {
            transform: scale(0.95) translateY(0);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }

        .animate-gameOverBounce {
          animation: gameOverBounce 0.6s ease-out forwards;
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes bad-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .animate-bad-pulse {
          animation: bad-pulse 1s ease-in-out infinite;
        }

        @keyframes blink-cursor {
          0%, 49% {
            border-color: #22c55e;
          }
          50%, 100% {
            border-color: transparent;
          }
        }

        .animate-blink-cursor {
          animation: blink-cursor 1s step-end infinite;
        }
      `}</style>
    </>
  );
};

export default SecretSantaGame;

