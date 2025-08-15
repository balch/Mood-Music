import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { GameBoardItem, Mood } from '../types';

interface GameButtonProps {
  item: GameBoardItem;
  dropdownMoods: Mood[];
  isRevealed: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onMoodSelect: (mood: Mood) => void;
  onCloseDropdown: () => void;
}

const GameButton: React.FC<GameButtonProps> = ({
  item,
  dropdownMoods,
  isRevealed,
  isPlaying,
  onClick,
  onMoodSelect,
  onCloseDropdown
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'up' | 'down'>('up');
  
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const iconColor = item.icon.color;

  const calculateAndSetPosition = () => {
    if (dropdownContainerRef.current) {
      const rect = dropdownContainerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const menuHeight = 280; // 17.5rem in pixels, which fits 6 items comfortably
      const margin = 8; // from mb-2/mt-2 classes (0.5rem = 8px)

      const headerElement = document.querySelector('header');
      const headerHeight = headerElement ? headerElement.offsetHeight : 0;

      const spaceAbove = rect.top - headerHeight - margin;
      const spaceBelow = viewportHeight - rect.bottom - margin;

      // Prefer to open up. Only open down if there's not enough space above.
      if (spaceAbove < menuHeight) {
        // If there's enough space below, open down.
        // Or if there's more space below than above (when neither is enough), also open down.
        if (spaceBelow >= menuHeight || spaceBelow > spaceAbove) {
          setDropdownPosition('down');
          return;
        }
      }
      // Default case: open up.
      setDropdownPosition('up');
    }
  };

  const handleButtonClick = () => {
    onClick();
    // Dropdown opening is handled by the isPlaying effect
  };

  const handleMoodSelection = (mood: Mood) => {
    onMoodSelect(mood);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    // Toggling the dropdown should also toggle the music playback.
    // The `onClick` prop (handleCardClick in App.tsx) already manages this logic.
    // The `useEffect` hook listening to the `isPlaying` prop will then open/close the dropdown.
    onClick();
  };

  useLayoutEffect(() => {
    if (isDropdownOpen) {
      calculateAndSetPosition();
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isPlaying) {
      setDropdownOpen(true);
    } else {
      // This will close dropdown when music stops (e.g., another card is clicked)
      setDropdownOpen(false); 
    }
  }, [isPlaying]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        onCloseDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, onCloseDropdown]);

  const borderClass = () => {
    if (!isRevealed) {
      return 'border-transparent';
    }
    switch (item.status) {
      case 'correct':
        return 'border-green-400';
      case 'incorrect':
        return 'border-red-500';
      default:
        return 'border-transparent';
    }
  };

  const ringClass = isPlaying ? `ring-4 ring-offset-2 ring-offset-indigo-950 ring-[${iconColor}]` : 'ring-0';

  const dropdownMenuClasses = `absolute bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 ${
    dropdownPosition === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
  } left-0 min-w-full`;

  return (
    <div className={`relative ${isPlaying ? 'z-30' : ''} flex items-center justify-center`} ref={cardRef}>
      <div
        className={`relative aspect-square flex flex-col justify-between p-4 rounded-2xl shadow-lg border-4 transition-all duration-300 ${borderClass()} ${ringClass}`}
        style={{ backgroundColor: `${iconColor}20` }} /* 20 is for 12.5% opacity */
      >
        <button 
            className="flex-grow flex items-center justify-center h-full w-full cursor-pointer"
            onClick={handleButtonClick}
            aria-label={`Play music for ${item.icon.name}`}
        >
            <item.icon.Component className="w-2/3 h-2/3 opacity-80 transition-transform hover:scale-110" style={{ color: iconColor }} />
        </button>
        {isRevealed && (
            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white ${item.status === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                {item.status === 'correct' ? '✓' : '✗'}
            </div>
        )}
        
        <div className="relative" ref={dropdownContainerRef}>
          <button
              onClick={toggleDropdown}
              className={`w-full mt-2 py-2 px-3 text-white rounded-lg flex items-center justify-between font-semibold transition-colors duration-200 text-sm sm:text-base ${item.selectedMood ? `bg-[${iconColor}]/60 hover:bg-[${iconColor}]/80` : `bg-[${iconColor}]/40 hover:bg-[${iconColor}]/60`}`}
          >
            {item.selectedMood ? (
              <span className="flex items-center justify-between flex-grow mr-2 overflow-hidden">
                <span className="flex items-center gap-2 truncate">
                  <span className="text-2xl">{item.selectedMood.emoji}</span>
                  <span className="truncate">{item.selectedMood.name}</span>
                </span>
                <span className="text-2xl hidden sm:inline">{item.selectedMood.emoji}</span>
              </span>
            ) : (
              <span className="flex items-center justify-between flex-grow mr-2 overflow-hidden opacity-80">
                <span className="flex items-center gap-2">
                  <span className="text-2xl drop-shadow-sm">🎭</span>
                  <span>Select</span>
                </span>
                <span className="text-2xl hidden sm:inline drop-shadow-sm">🎭</span>
              </span>
            )}
            <svg className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div
              className={dropdownMenuClasses}
              style={{ height: '17.5rem' }}
            >
              <ul className="p-1 h-full overflow-y-auto z-100" >
                {dropdownMoods.map(mood => (
                  <li key={mood.name}>
                    <button
                      onClick={() => handleMoodSelection(mood)}
                      className="w-full px-3 py-2 rounded-md hover:bg-indigo-600 flex items-center justify-between transition-colors text-gray-200"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{mood.emoji}</span>
                        <span className="font-medium">{mood.name}</span>
                      </span>
                        <span className="text-xl">{mood.emoji}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameButton;