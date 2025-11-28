'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const SnowEffect = dynamic(() => import('@/components/SnowEffect'), { ssr: false });
const SparkleEffect = dynamic(() => import('@/components/SparkleEffect'), { ssr: false });
const RandomGifEffect = dynamic(() => import('@/components/RandomGifEffect'), { ssr: false });
const SecretSantaGame = dynamic(() => import('@/components/SecretSantaGame'), { ssr: false });

const Page = () => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [prevTime, setPrevTime] = useState(null);

    useEffect(() => {
        setMounted(true);
        
        const calculateTimeLeft = () => {
            const currentYear = new Date().getFullYear();
            const targetDate = new Date(`${currentYear}-12-25T00:00:00`); // Christmas day (December 25th at midnight)
            const now = new Date();
            const difference = targetDate - now;

            if (difference <= 0) {
                return {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isPartyTime: true
                };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                isPartyTime: false
            };
        };

        // Initial calculation
        const initialTime = calculateTimeLeft();
        setTimeLeft(initialTime);
        setPrevTime(initialTime);

        // Update every second
        const timer = setInterval(() => {
            setTimeLeft((currentTime) => {
                setPrevTime(currentTime);
                return calculateTimeLeft();
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!mounted || !timeLeft) {
        return;
    }

    const TimeUnit = ({ value, label, prevValue }) => {
        const hasChanged = prevValue !== value;
        
        return (
            <div className="flex flex-col items-center justify-center gap-2 min-w-[100px]" style={{ animationDelay: `${Math.random() * 0.3}s` }}>
                <div className={`text-5xl sm:text-7xl font-extrabold tabular-nums text-center leading-none transition-all duration-300 ${hasChanged ? 'animate-numberPop' : ''}`}>
                    {String(value).padStart(2, '0')}
                </div>
                <div className="text-xs font-semibold text-white uppercase tracking-widest opacity-90">
                    {label}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0"></div>
            <SnowEffect />
            <SparkleEffect />
            <RandomGifEffect />
            <SecretSantaGame />
            
            <div className="flex flex-col items-center justify-center relative z-20 px-4 -mt-[6vh]">
                {timeLeft.isPartyTime ? (
                    <h1 className="text-4xl md:text-5xl text-center font-bold mb-8 md:mb-12 text-yellow-400 drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]">
                        Merry Christmas! 🎉
                    </h1>
                ) : (
                    <>
                        <h1 className="text-4xl md:text-5xl text-center font-bold mb-8 md:mb-12 text-yellow-400 drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]">
                            It's almost christmas!
                        </h1>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            <TimeUnit 
                                value={timeLeft.days} 
                                label="Days" 
                                prevValue={prevTime?.days}
                            />
                            <TimeUnit 
                                value={timeLeft.hours} 
                                label="Hours" 
                                prevValue={prevTime?.hours}
                            />
                            <TimeUnit 
                                value={timeLeft.minutes} 
                                label="Minutes" 
                                prevValue={prevTime?.minutes}
                            />
                            <TimeUnit 
                                value={timeLeft.seconds} 
                                label="Seconds" 
                                prevValue={prevTime?.seconds}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Page;
