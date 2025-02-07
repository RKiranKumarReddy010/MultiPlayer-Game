"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import Confetti from "react-confetti";
import { Users } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import GameBoard from "@/components/GameBoard";
import { Button } from "@/components/ui/button";

interface Player {
  name: string;
  points: number;
  isHost: boolean;
}

interface GameState {
  party_code: string;
  status: "waiting" | "playing" | "finished";
  players: Player[];
  currentRound?: {
    numbers: { [key: string]: number };
    mean?: number | null;
    winner?: string | null;
  };
}

export default function GamePageClient({ code }: { code: string }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!code) return;
    const gameRef = ref(database, `games/${code}`);

    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        notFound();
      }

      // Initialize points to 5 if not set
      if (data?.players) {
        data.players = data.players.map((player: Player) => ({
          ...player,
          points: player.points ?? 5,
        }));
      }

      setGame(data);
      if (data?.status === "finished") {
        setShowConfetti(true);
      }
    });

    return () => unsubscribe();
  }, [code]);

  const selectNumber = (num: number) => {
    if (!game || selectedNumber !== null) return;
    setSelectedNumber(num);
  };

  const submitNumber = async () => {
    if (!game || selectedNumber === null || isSubmitted) return;

    const currentPlayer = game.players.find(
      (p) => p.name === localStorage.getItem("playerName")
    );
    if (!currentPlayer) return;

    const updatedGame = {
      ...game,
      currentRound: {
        ...game.currentRound,
        numbers: {
          ...game.currentRound?.numbers,
          [currentPlayer.name]: selectedNumber,
        },
      },
    };

    setIsSubmitted(true);
    await set(ref(database, `games/${code}`), updatedGame);

    if (Object.keys(updatedGame.currentRound?.numbers || {}).length === game.players.length) {
      calculateRoundResult(updatedGame);
    }
  };

  const calculateRoundResult = async (gameState: GameState) => {
    const numbers = Object.values(gameState.currentRound?.numbers || {});
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;

    let closestPlayer = "";
    let minDiff = Infinity;

    Object.entries(gameState.currentRound?.numbers || {}).forEach(([player, num]) => {
      const diff = Math.abs(num - mean);
      if (diff < minDiff) {
        minDiff = diff;
        closestPlayer = player;
      }
    });

    const updatedPlayers = gameState.players.map((player) => ({
      ...player,
      points: player.name !== closestPlayer ? player.points - 1 : player.points,
    }));

    updatedPlayers.forEach((player) => {
      if (player.points <= 0 && player.name === localStorage.getItem("playerName")) {
        window.location.href = "https://www.youtube.com/shorts/G29xUZO_6Eo";
      }
    });

    const updatedGame = {
      ...gameState,
      players: updatedPlayers,
      currentRound: { mean, winner: closestPlayer },
      status: updatedPlayers.filter((p) => p.points > 0).length === 1 ? "finished" : "playing",
    };

    await set(ref(database, `games/${code}`), updatedGame);
  };

  const startNextRound = async () => {
    if (!game) return;

    const updatedGame = {
      ...game,
      currentRound: {
        numbers: {},
        mean: null,
        winner: null,
      },
      status: "playing",
    };

    setSelectedNumber(null);
    setIsSubmitted(false);

    await set(ref(database, `games/${code}`), updatedGame);
  };

  if (!game) return <div>Loading...</div>;

  const allPlayersSubmitted =
    Object.keys(game.currentRound?.numbers || {}).length === game.players.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      {showConfetti && <Confetti />}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Party Code: {code}</h1>
          <div className="flex items-center gap-2">
            <Users className="text-white" />
            <span className="text-white">Players: {game.players.length}</span>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Game Board</h2>
          <GameBoard onSelectNumber={selectNumber} selectedNumber={selectedNumber} />
          <div className="mt-4 flex justify-center">
            <Button
              onClick={submitNumber}
              disabled={selectedNumber === null || isSubmitted}
              className="px-6 py-2 text-lg font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              {isSubmitted ? "Submitted" : "Submit"}
            </Button>
          </div>
        </Card>

        {game.currentRound?.mean && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Round Result</h2>
            <p>Mean: {game.currentRound.mean.toFixed(2)}</p>
            <p>Winner: {game.currentRound.winner}</p>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          <ul>
            {game.players.map((player) => (
              <li key={player.name} className="flex justify-between py-2">
                <span className="font-semibold">{player.name}</span>
                <span className="text-gray-700">Points: {player.points}</span>
              </li>
            ))}
          </ul>
        </Card>

        {game.status !== "finished" && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-white">
              {Object.keys(game.currentRound?.numbers || {}).length} / {game.players.length} players submitted
            </p>
            <Button
              onClick={startNextRound}
              disabled={!allPlayersSubmitted}
              className={`px-6 py-2 text-lg font-bold rounded-lg ${
                allPlayersSubmitted ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              Start Next Round
            </Button>
          </div>
        )}

        {game.status === "finished" && (
          <Card className="p-6 bg-yellow-500 text-white text-center font-bold">
            🎉 Winner: {game.players.find((p) => p.points > 0)?.name} 🎉
          </Card>
        )}
      </div>
    </div>
  );
}
