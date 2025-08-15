import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types';

interface FooterProps {
  gameState: GameState;
  allSelected: boolean;
  onReveal: () => void;
  isVictorySongPlaying: boolean;
}

const Footer: React.FC<FooterProps> = ({ gameState, allSelected, onReveal, isVictorySongPlaying }) => {
  const isDisabled = !allSelected && gameState === GameState.Playing;
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isVictorySongPlaying) {
      setCountdown(30);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setCountdown(30);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isVictorySongPlaying]);

  const getButtonContent = () => {
    switch (gameState) {
      case GameState.Won:
        if (isVictorySongPlaying) {
          return `⏹️ Stop Victory Song (${countdown}s)`;
        }
        return '🎉 Play Victory Song! 🎉';
      case GameState.Revealed:
        return '🤔 Try Again? 🔄';
      default:
        return '🔮 Reveal Answers 🔮';
    }
  };

  const getButtonClass = () => {
    let baseClass = 'w-full max-w-md mx-auto py-4 px-6 text-xl font-bold rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105';
    if (isDisabled) {
      return `${baseClass} bg-gray-600 text-gray-400 cursor-not-allowed`;
    }
    if (gameState === GameState.Won) {
      if (isVictorySongPlaying) {
        return `${baseClass} bg-red-600 hover:bg-red-500 text-white shadow-red-600/50`;
      }
      return `${baseClass} bg-green-500 hover:bg-green-400 text-white shadow-green-500/50`;
    }
    if (gameState === GameState.Revealed) {
        return `${baseClass} bg-yellow-500 hover:bg-yellow-400 text-gray-900 shadow-yellow-500/50`;
    }
    return `${baseClass} bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/50`;
  };

  return (
    <footer className="w-full max-w-5xl mx-auto p-4 rounded-xl bg-indigo-900/80 border border-indigo-700/50 mt-4">
      <div className="flex items-center justify-center">
        <button
          onClick={onReveal}
          disabled={isDisabled}
          className={getButtonClass()}
        >
          {getButtonContent()}
        </button>
      </div>
    </footer>
  );
};

export default Footer;