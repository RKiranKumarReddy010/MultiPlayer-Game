import GamePageClient from "./GamePageClient";

export default function GamePage({ params }: { params: { code: string } }) {
  return <GamePageClient code={params.code} />;
}
