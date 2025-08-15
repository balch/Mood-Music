import React from 'react';

export enum Difficulty {
  Easy = 'Easy',
  Hard = 'Hard',
}

export enum GameState {
  Playing = 'Playing',
  Revealed = 'Revealed',
  Won = 'Won',
}

export interface Mood {
  name: string;
  emoji: string;
  prompt: string;
}

export interface Icon {
  name: string;
  Component: React.FC<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export interface GameBoardItem {
  id: number;
  icon: Icon;
  correctMood: Mood;
  selectedMood: Mood | null;
  status: 'none' | 'correct' | 'incorrect';
}

export interface LivePrompt {
  text: string;
  weight: number;
}