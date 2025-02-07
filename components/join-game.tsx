'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TowerControl as GameController } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

export default function JoinGame() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createGame = async () => {
    if (!name) return;
    setIsCreating(true);
    
    const newPartyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRef = ref(database, `games/${newPartyCode}`);
    
    await set(gameRef, {
      party_code: newPartyCode,
      status: 'waiting',
      players: [{
        name,
        points: 5,
        isHost: true,
      }]
    });

    localStorage.setItem('playerName', name);
    router.push(`/game/${newPartyCode}`);
  };

  const joinGame = async () => {
    if (!name || !partyCode) return;

    const gameRef = ref(database, `games/${partyCode.toUpperCase()}`);
    const snapshot = await get(gameRef);
    const game = snapshot.val();

    if (!game) {
      console.error('Game not found');
      return;
    }

    const updatedPlayers = [...game.players, {
      name,
      points: 5,
      isHost: false,
    }];

    await set(gameRef, {
      ...game,
      players: updatedPlayers
    });

    localStorage.setItem('playerName', name);
    router.push(`/game/${partyCode.toUpperCase()}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <GameController className="w-6 h-6" />
          Alice In BorderLand - KING ♠ Game
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Enter party code to join"
            value={partyCode}
            onChange={(e) => setPartyCode(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={joinGame}
            className="w-full"
            disabled={!name || !partyCode}
          >
            <Users className="mr-2 h-4 w-4" />
            Join Game
          </Button>
          <Button
            onClick={createGame}
            variant="secondary"
            className="w-full"
            disabled={!name || isCreating}
          >
            <GameController className="mr-2 h-4 w-4" />
            Create New Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}