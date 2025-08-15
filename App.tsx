import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Difficulty, GameState, type GameBoardItem, type Mood } from './types';
import { MOODS, ICONS } from './constants';
import { logger } from './services/logger';
import { LyriaService } from './services/lyriaService';
import Header from './components/Header';
import Footer from './components/Footer';
import GameButton from './components/GameButton';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [gameState, setGameState] = useState<GameState>(GameState.Playing);
  const [attempts, setAttempts] = useState<number>(0);
  const [gameBoard, setGameBoard] = useState<GameBoardItem[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const musicTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVictorySongPlaying, setIsVictorySongPlaying] = useState(false);

  const stopCurrentMusic = useCallback(() => {
    LyriaService.stop();
    if (musicTimeoutId.current) {
      clearTimeout(musicTimeoutId.current);
      musicTimeoutId.current = null;
    }
    setActivePlayerId(null);
    setIsVictorySongPlaying(false);
  }, []);

  const startNewGame = useCallback(() => {
    logger.info(`Starting new game with difficulty: ${difficulty}`);
    stopCurrentMusic();
    const shuffledMoods = shuffleArray(MOODS);
    const shuffledIcons = shuffleArray(ICONS);

    const newBoard = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      icon: shuffledIcons[i % shuffledIcons.length],
      correctMood: shuffledMoods[i],
      selectedMood: null,
      status: 'none' as const,
    }));

    setGameBoard(newBoard);
    setAttempts(0);
    setGameState(GameState.Playing);
  }, [difficulty, stopCurrentMusic]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleDifficultyToggle = useCallback(() => {
    setDifficulty(prev => (prev === Difficulty.Easy ? Difficulty.Hard : Difficulty.Easy));
  }, []);

  const handleMoodSelect = (id: number, mood: Mood) => {
    logger.debug(`Mood "${mood.name}" selected for card ${id}`);
    stopCurrentMusic();
    setGameBoard(prevBoard =>
      prevBoard.map(item => (item.id === id ? { ...item, selectedMood: mood } : item))
    );
  };

  const handleCardClick = async (item: GameBoardItem) => {
    if (gameState === GameState.Won) return;

    if (activePlayerId === item.id) {
      stopCurrentMusic();
    } else {
      stopCurrentMusic(); // Stop anything else playing
      logger.info(`Playing music for mood: ${item.correctMood.name}`);

      LyriaService.reset()
      await LyriaService.setConfig({ guidance: 6.0 })

      await LyriaService.play('mood', item.correctMood.name + '-' + item.correctMood.prompt);
      setActivePlayerId(item.id);

      musicTimeoutId.current = setTimeout(() => {
          logger.info('Music automatically stopped after 30s.');
          stopCurrentMusic();
      }, 30000);

      if (gameState === GameState.Revealed) {
        setGameBoard(prevBoard =>
          prevBoard.map(boardItem =>
            boardItem.id === item.id ? { ...item, status: 'none' } : boardItem
          )
        );
      }
    }
  };

  const handleRevealClick = async () => {
    if (gameState === GameState.Won) {
      if (isVictorySongPlaying) {
        stopCurrentMusic();
      } else {
        stopCurrentMusic(); // Stop card music if any
        await LyriaService.play('victory');
        setIsVictorySongPlaying(true);
        musicTimeoutId.current = setTimeout(() => {
          logger.info('Victory music automatically stopped after 30s.');
          stopCurrentMusic();
        }, 30000);
      }
      return;
    }

    logger.info('Revealing answers...');
    setAttempts(prev => prev + 1);
    stopCurrentMusic();

    let allCorrect = true;
    const newBoard = gameBoard.map(item => {
      const isCorrect = item.selectedMood?.name === item.correctMood.name;
      if (!isCorrect) allCorrect = false;
      return { ...item, status: isCorrect ? 'correct' : 'incorrect' } as GameBoardItem;
    });

    setGameBoard(newBoard);

    if (allCorrect) {
      logger.info('Congratulations! All moods guessed correctly.');
      setGameState(GameState.Won);
    } else {
      logger.info('Some guesses were incorrect. Try again!');
      setGameState(GameState.Revealed);
    }
  };

  const dropdownMoods = useMemo(() => {
    const moodsToSort = difficulty === Difficulty.Easy
      ? gameBoard.map(item => item.correctMood)
      : MOODS;
    
    return [...moodsToSort].sort((a, b) => a.name.localeCompare(b.name));
  }, [difficulty, gameBoard]);

  const allSelected = useMemo(() => gameBoard.every(item => item.selectedMood !== null), [gameBoard]);
  const correctCount = useMemo(() => gameBoard.filter(item => item.status === 'correct').length, [gameBoard]);

  return (
    <div className="flex flex-col min-h-screen md:h-dvh bg-indigo-950 p-4 sm:p-6 md:p-8">
      <Header
        attempts={attempts}
        correctCount={gameState === GameState.Won ? 6 : correctCount}
        difficulty={difficulty}
        onNewGame={startNewGame}
        onToggleDifficulty={handleDifficultyToggle}
      />
      <main className="flex-grow flex justify-center py-6 min-h-0 overflow-y-auto relative z-10">
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {gameBoard.map(item => (
            <GameButton
              key={item.id}
              item={item}
              dropdownMoods={dropdownMoods}
              isRevealed={gameState === GameState.Revealed || gameState === GameState.Won}
              isPlaying={activePlayerId === item.id}
              onClick={() => handleCardClick(item)}
              onMoodSelect={(mood) => handleMoodSelect(item.id, mood)}
              onCloseDropdown={stopCurrentMusic}
            />
          ))}
        </div>
      </main>
      <Footer
        gameState={gameState}
        allSelected={allSelected}
        onReveal={handleRevealClick}
        isVictorySongPlaying={isVictorySongPlaying}
      />
    </div>
  );
};

export default App;
