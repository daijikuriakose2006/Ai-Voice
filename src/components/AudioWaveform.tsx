import React, { useEffect, useState } from 'react';

interface AudioWaveformProps {
  isSpeaking: boolean;
  speaker: 'ai' | 'user' | 'idle';
  audioLevel?: number; // 0 to 100
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isSpeaking, speaker, audioLevel = 0 }) => {
  const [randomBars, setRandomBars] = useState<number[]>([15, 25, 40, 60, 30, 75, 45, 20]);

  useEffect(() => {
    if (!isSpeaking) {
      setRandomBars([12, 16, 12, 18, 12, 15, 12, 14]);
      return;
    }

    const interval = setInterval(() => {
      setRandomBars(prev => prev.map(() => Math.floor(Math.random() * 65) + 20));
    }, 120);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6">
      {/* Central Pulsing Avatar / Orb */}
      <div className="relative flex items-center justify-center">
        {/* Outer Glow Ring */}
        <div
          className={`absolute w-36 h-36 rounded-full transition-all duration-500 ${
            isSpeaking && speaker === 'ai'
              ? 'bg-amber-500/20 dark:bg-amber-400/20 scale-125 animate-pulse'
              : isSpeaking && speaker === 'user'
              ? 'bg-emerald-500/20 dark:bg-emerald-400/20 scale-125 animate-pulse'
              : 'bg-neutral-300/30 dark:bg-neutral-700/20 scale-100'
          }`}
        />

        {/* Secondary Ripple */}
        <div
          className={`absolute w-28 h-28 rounded-full border transition-all duration-300 ${
            isSpeaking
              ? speaker === 'ai'
                ? 'border-amber-500/40 dark:border-amber-400/40 scale-110'
                : 'border-emerald-500/40 dark:border-emerald-400/40 scale-110'
              : 'border-neutral-300 dark:border-neutral-700 scale-95'
          }`}
        />

        {/* Main Inner Core */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 z-10 ${
            speaker === 'ai'
              ? 'bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700 text-amber-300 dark:from-neutral-800 dark:to-neutral-600'
              : speaker === 'user'
              ? 'bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white'
              : 'bg-neutral-900 dark:bg-neutral-800 text-neutral-400'
          } ${isSpeaking ? 'scale-105' : 'scale-100'}`}
        >
          {speaker === 'ai' ? (
            <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4m-4 0h8" />
            </svg>
          ) : speaker === 'user' ? (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dynamic Sound Equalizer Waveform Bars */}
      <div className="flex items-center gap-1.5 h-10 px-4">
        {randomBars.map((height, idx) => (
          <div
            key={idx}
            style={{ height: `${height}%` }}
            className={`w-1.5 rounded-full transition-all duration-100 ${
              isSpeaking
                ? speaker === 'ai'
                  ? 'bg-neutral-800 dark:bg-amber-400'
                  : 'bg-emerald-600 dark:bg-emerald-400'
                : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
