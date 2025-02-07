"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

export default function JoinGame() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const createGame = async () => {
    try {
      if (!name) return;
      setIsCreating(true);
      setError('');
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const supabase = getSupabase();
      const { data: game, error } = await supabase
        .from('games')
        .insert([
          {
            code,
            status: 'waiting',
            players: [{ name, points: 5, id: crypto.randomUUID() }]
          }
        ])
        .select()
        .single();

      if (error) throw error;
      if (game) {
        localStorage.setItem('playerId', game.players[0].id);
        router.push(`/game/${game.code}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const joinGame = async () => {
    try {
      if (!name || !partyCode) return;
      setError('');
      
      const supabase = getSupabase();
      const { data: game, error: fetchError } = await supabase
        .from('games')
        .select()
        .eq('code', partyCode.toUpperCase())
        .single();

      if (fetchError) throw fetchError;

      if (game && game.status === 'waiting') {
        const playerId = crypto.randomUUID();
        const updatedPlayers = [...game.players, { name, points: 5, id: playerId }];
        
        const { error: updateError } = await supabase
          .from('games')
          .update({ players: updatedPlayers })
          .eq('code', partyCode.toUpperCase());

        if (updateError) throw updateError;

        localStorage.setItem('playerId', playerId);
        router.push(`/game/${partyCode.toUpperCase()}`);
      } else {
        throw new Error('Game not found or already started');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          <span>Number Game</span>
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
        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            onClick={joinGame}
            disabled={!name || !partyCode}
            className="w-full"
          >
            Join Game
          </Button>
          <Button
            onClick={createGame}
            disabled={!name || isCreating}
            variant="outline"
            className="w-full"
          >
            Create New Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}