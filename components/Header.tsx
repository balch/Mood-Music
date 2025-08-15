import React from 'react';
import { Difficulty } from '../types';

interface HeaderProps {
  attempts: number;
  correctCount: number;
  difficulty: Difficulty;
  onNewGame: () => void;
  onToggleDifficulty: () => void;
}

const Header: React.FC<HeaderProps> = ({ attempts, correctCount, difficulty, onNewGame, onToggleDifficulty }) => {
  return (
    <header className="w-full max-w-5xl mx-auto p-4 rounded-xl bg-purple-700 border border-indigo-700/50 shadow-lg">
      {/* Main responsive container */}
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        {/* Title Emojis */}
        <div className="flex items-center gap-3 px-4 py-2 bg-purple-400 rounded-lg shadow-inner border border-purple-300/50">
          <span className="text-2xl drop-shadow-sm">🤔</span>
          <span className="text-2xl drop-shadow-sm">🎭</span>
          <span className="text-2xl drop-shadow-sm">🎶</span>
        </div>

        {/* Container for stats and controls */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end w-full sm:w-auto gap-x-4 gap-y-2">
          {/* Stats */}
          <div className="flex items-center gap-4 text-lg font-semibold">
              <span className="flex items-center gap-2">
                  <span className="text-2xl drop-shadow-sm">✅</span>
                  <span>{correctCount}</span>
              </span>
              <span className="flex items-center gap-2">
                  <span className="text-2xl drop-shadow-sm">🎯</span>
                  <span>{attempts}</span>
              </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNewGame}
              className="px-4 py-2 text-sm font-semibold text-sky-900  bg-purple-400 rounded-lg hover:bg-sky-300 transition-colors shadow-md flex items-center gap-2"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative text-xs font-bold text-white bg-sky-500 rounded-full px-1.5 py-0.5">NEW</span>
              </div>
              <span className="hidden sm:inline">Game</span>
            </button>
            <button
              onClick={onToggleDifficulty}
              title={`Toggle difficulty (Current: ${difficulty})`}
              className="px-4 py-2 text-sm font-semibold text-sky-800 bg-purple-400 rounded-lg hover:bg-sky-400 transition-colors shadow-md flex items-center gap-2"
            >
              {difficulty === Difficulty.Hard ? '🔥' : '🍰'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;