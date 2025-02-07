'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface GameBoardProps {
  onSelectNumber: (num: number) => void;
  selectedNumber: number | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ onSelectNumber, selectedNumber }) => {
  if (!onSelectNumber) {
    console.error("onSelectNumber function is not defined");
    return null;
  }

  const handleClick = useCallback(
    (num: number) => {
      if (!selectedNumber) {
        onSelectNumber(num);
      }
    },
    [onSelectNumber, selectedNumber]
  );

  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
        <Button
          key={num}
          variant={selectedNumber === num ? 'secondary' : 'outline'}
          className="min-w-16 min-h-16 text-lg font-semibold"
          onClick={() => handleClick(num)}
          disabled={selectedNumber !== null}
        >
          {num}
        </Button>
      ))}
    </div>
  );
};

export default GameBoard;
